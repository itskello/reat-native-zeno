-- PayDunya sandbox withdrawals reserve a user's XOF by posting an immutable
-- ledger debit before the provider is asked to execute the payout. Failed
-- payouts receive a compensating ledger transaction.

alter table public.mobile_money_operations
  add column if not exists refund_ledger_transaction_id uuid
  references public.ledger_transactions(id) on delete restrict;

alter table public.mobile_money_operations
  drop constraint if exists mobile_money_terminal_consistency;

alter table public.mobile_money_operations
  add constraint mobile_money_terminal_consistency check (
    (status = 'succeeded'
      and ledger_transaction_id is not null
      and refund_ledger_transaction_id is null
      and completed_at is not null)
    or (status = 'processing' and direction = 'deposit'
      and ledger_transaction_id is null
      and refund_ledger_transaction_id is null
      and completed_at is null)
    or (status = 'processing' and direction = 'withdrawal'
      and ledger_transaction_id is not null
      and refund_ledger_transaction_id is null
      and completed_at is null)
    or (status in ('created', 'awaiting_authorization', 'expired')
      and ledger_transaction_id is null
      and refund_ledger_transaction_id is null
      and completed_at is null)
    or (status = 'failed' and completed_at is null
      and ((ledger_transaction_id is null and refund_ledger_transaction_id is null)
        or (direction = 'withdrawal'
          and ledger_transaction_id is not null
          and refund_ledger_transaction_id is not null)))
  );

create or replace function public.reserve_mobile_money_withdrawal(
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
  if v_operation.direction <> 'withdrawal' or v_operation.provider_id <> 'paydunya'
     or v_operation.wallet_currency <> 'XOF' then
    raise exception 'Operation is not a PayDunya XOF withdrawal' using errcode = '22023';
  end if;
  if v_operation.provider_operation_id is distinct from p_provider_operation_id then
    raise exception 'Provider operation id does not match' using errcode = '23514';
  end if;
  if v_operation.status = 'processing' and v_operation.ledger_transaction_id is not null then
    return v_operation.ledger_transaction_id;
  end if;
  if v_operation.status <> 'awaiting_authorization' then
    raise exception 'Withdrawal cannot be reserved from its current state' using errcode = '23514';
  end if;

  perform public.provision_wallet_accounts(v_operation.user_id);
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
    'mobile-money:withdrawal:' || v_operation.id::text,
    'withdrawal',
    v_operation.reference,
    'XOF',
    v_operation.source_amount_xof,
    0,
    jsonb_build_array(
      jsonb_build_object('account_id', v_wallet_account_id, 'side', 'debit', 'amount_minor', v_operation.source_amount_xof),
      jsonb_build_object('account_id', v_clearing_account_id, 'side', 'credit', 'amount_minor', v_operation.source_amount_xof)
    ),
    jsonb_build_object(
      'provider', 'paydunya',
      'providerOperationId', p_provider_operation_id,
      'mobileMoneyOperationId', v_operation.id,
      'direction', 'withdrawal'
    )
  );

  update public.mobile_money_operations
  set status = 'processing', ledger_transaction_id = v_transaction_id
  where id = p_operation_id;
  return v_transaction_id;
end;
$$;

create or replace function public.settle_mobile_money_withdrawal(
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
begin
  select * into v_operation
  from public.mobile_money_operations
  where id = p_operation_id
  for update;
  if not found then raise exception 'Mobile Money operation not found' using errcode = 'P0002'; end if;
  if v_operation.direction <> 'withdrawal' or v_operation.provider_id <> 'paydunya'
     or v_operation.provider_operation_id is distinct from p_provider_operation_id then
    raise exception 'PayDunya withdrawal does not match' using errcode = '23514';
  end if;
  if v_operation.status = 'succeeded' then return v_operation.ledger_transaction_id; end if;
  if v_operation.status <> 'processing' or v_operation.ledger_transaction_id is null then
    raise exception 'Withdrawal is not awaiting provider settlement' using errcode = '23514';
  end if;
  update public.mobile_money_operations
  set status = 'succeeded', completed_at = now()
  where id = p_operation_id;
  return v_operation.ledger_transaction_id;
end;
$$;

create or replace function public.fail_mobile_money_withdrawal(
  p_operation_id uuid,
  p_provider_operation_id text,
  p_failure_code text
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
  v_refund_transaction_id uuid;
begin
  select * into v_operation
  from public.mobile_money_operations
  where id = p_operation_id
  for update;
  if not found then raise exception 'Mobile Money operation not found' using errcode = 'P0002'; end if;
  if v_operation.direction <> 'withdrawal' or v_operation.provider_id <> 'paydunya'
     or v_operation.provider_operation_id is distinct from p_provider_operation_id then
    raise exception 'PayDunya withdrawal does not match' using errcode = '23514';
  end if;
  if v_operation.status = 'failed' then return v_operation.refund_ledger_transaction_id; end if;
  if v_operation.status not in ('created', 'awaiting_authorization', 'processing') then
    raise exception 'Withdrawal cannot fail from its current state' using errcode = '23514';
  end if;

  if v_operation.status = 'processing' then
    select id into v_wallet_account_id
    from public.ledger_accounts
    where owner_user_id = v_operation.user_id and currency = 'XOF'
      and account_type = 'wallet_liability';
    select id into v_clearing_account_id
    from public.ledger_accounts
    where account_code = 'system:clearing:XOF' and account_type = 'clearing_asset';
    v_refund_transaction_id := public.post_ledger_transaction(
      v_operation.user_id,
      null,
      'mobile-money:withdrawal-refund:' || v_operation.id::text,
      'refund',
      v_operation.reference || '-REFUND',
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
        'mobileMoneyOperationId', v_operation.id,
        'direction', 'withdrawal_refund'
      )
    );
  end if;

  update public.mobile_money_operations
  set status = 'failed',
      refund_ledger_transaction_id = v_refund_transaction_id,
      failure_code = left(coalesce(p_failure_code, 'provider_failed'), 80),
      failure_message = 'PayDunya did not complete the payout.'
  where id = p_operation_id;
  return v_refund_transaction_id;
end;
$$;

revoke all on function public.reserve_mobile_money_withdrawal(uuid, text) from public, anon, authenticated;
revoke all on function public.settle_mobile_money_withdrawal(uuid, text) from public, anon, authenticated;
revoke all on function public.fail_mobile_money_withdrawal(uuid, text, text) from public, anon, authenticated;
grant execute on function public.reserve_mobile_money_withdrawal(uuid, text) to service_role;
grant execute on function public.settle_mobile_money_withdrawal(uuid, text) to service_role;
grant execute on function public.fail_mobile_money_withdrawal(uuid, text, text) to service_role;
