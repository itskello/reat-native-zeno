-- Post a provider-confirmed XOF deposit and close its operation atomically.
-- The function is callable only by trusted server code using the service role.
create or replace function public.settle_mobile_money_deposit(
  p_operation_id uuid,
  p_provider_operation_id text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_operation public.mobile_money_operations%rowtype;
  v_wallet_account_id uuid;
  v_clearing_account_id uuid;
  v_transaction_id uuid;
begin
  select * into v_operation
  from public.mobile_money_operations
  where id = p_operation_id
  for update;

  if not found then
    raise exception 'Mobile Money operation not found' using errcode = 'P0002';
  end if;
  if v_operation.direction <> 'deposit' or v_operation.provider_id <> 'paydunya' then
    raise exception 'Operation is not a PayDunya deposit' using errcode = '22023';
  end if;
  if p_provider_operation_id is null or length(trim(p_provider_operation_id)) < 1 then
    raise exception 'Provider operation id is required' using errcode = '22023';
  end if;
  if v_operation.provider_operation_id is distinct from p_provider_operation_id then
    raise exception 'Provider operation id does not match' using errcode = '23514';
  end if;
  if v_operation.status = 'succeeded' then
    return v_operation.ledger_transaction_id;
  end if;
  if v_operation.status not in ('created', 'awaiting_authorization', 'processing') then
    raise exception 'Operation cannot be settled from its current state' using errcode = '23514';
  end if;

  -- Walk the state machine before closing; the trigger rejects skipped states.
  if v_operation.status = 'created' then
    update public.mobile_money_operations set status = 'awaiting_authorization' where id = p_operation_id;
    v_operation.status := 'awaiting_authorization';
  end if;
  if v_operation.status = 'awaiting_authorization' then
    update public.mobile_money_operations set status = 'processing' where id = p_operation_id;
  end if;

  select id into v_wallet_account_id
  from public.ledger_accounts
  where owner_user_id = v_operation.user_id
    and currency = 'XOF'
    and account_type = 'wallet_liability';

  select id into v_clearing_account_id
  from public.ledger_accounts
  where account_code = 'system:clearing:XOF'
    and account_type = 'clearing_asset';

  if v_wallet_account_id is null or v_clearing_account_id is null then
    raise exception 'XOF ledger accounts are not provisioned' using errcode = '23514';
  end if;

  v_transaction_id := public.post_ledger_transaction(
    v_operation.user_id,
    null,
    'mobile-money:' || v_operation.id::text,
    'deposit',
    v_operation.reference,
    'XOF',
    v_operation.source_amount_xof,
    0,
    jsonb_build_array(
      jsonb_build_object('account_id', v_clearing_account_id, 'side', 'debit', 'amount_minor', v_operation.source_amount_xof),
      jsonb_build_object('account_id', v_wallet_account_id, 'side', 'credit', 'amount_minor', v_operation.source_amount_xof)
    ),
    jsonb_build_object(
      'provider', 'paydunya',
      'providerOperationId', p_provider_operation_id,
      'mobileMoneyOperationId', v_operation.id
    )
  );

  update public.mobile_money_operations
  set status = 'succeeded',
      ledger_transaction_id = v_transaction_id,
      completed_at = now()
  where id = p_operation_id;

  return v_transaction_id;
end;
$$;

revoke all on function public.settle_mobile_money_deposit(uuid, text)
  from public, anon, authenticated;
grant execute on function public.settle_mobile_money_deposit(uuid, text)
  to service_role;
