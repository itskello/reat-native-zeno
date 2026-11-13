-- Add local-currency wallet sub-balances for the selected Mobile Money markets.
-- USD remains the main wallet; local balances are separate and never auto-convert.

alter table public.ledger_accounts
  drop constraint if exists ledger_accounts_currency_check;
alter table public.ledger_accounts
  add constraint ledger_accounts_currency_check
  check (currency in ('USD', 'EUR', 'XOF', 'GHS', 'NGN', 'XAF', 'CDF'));

alter table public.ledger_transactions
  drop constraint if exists ledger_transactions_currency_check;
alter table public.ledger_transactions
  add constraint ledger_transactions_currency_check
  check (currency in ('USD', 'EUR', 'XOF', 'GHS', 'NGN', 'XAF', 'CDF'));

insert into public.ledger_accounts (owner_user_id, account_code, account_type, currency)
values
  (null, 'system:clearing:GHS', 'clearing_asset', 'GHS'),
  (null, 'system:clearing:NGN', 'clearing_asset', 'NGN'),
  (null, 'system:clearing:XAF', 'clearing_asset', 'XAF'),
  (null, 'system:clearing:CDF', 'clearing_asset', 'CDF'),
  (null, 'system:fees:GHS', 'fee_revenue', 'GHS'),
  (null, 'system:fees:NGN', 'fee_revenue', 'NGN'),
  (null, 'system:fees:XAF', 'fee_revenue', 'XAF'),
  (null, 'system:fees:CDF', 'fee_revenue', 'CDF')
on conflict (account_code) do nothing;

create or replace function public.provision_wallet_accounts(p_user_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null or length(trim(p_user_id)) < 3 or length(p_user_id) > 255 then
    raise exception 'Invalid user id' using errcode = '22023';
  end if;

  insert into public.ledger_accounts (owner_user_id, account_code, account_type, currency)
  select p_user_id, 'wallet:' || p_user_id || ':' || currency_code, 'wallet_liability', currency_code
  from unnest(array['USD', 'EUR', 'XOF', 'GHS', 'NGN', 'XAF', 'CDF']::text[]) currency_list(currency_code)
  on conflict (owner_user_id, currency) where account_type = 'wallet_liability' do nothing;
end;
$$;
revoke all on function public.provision_wallet_accounts(text) from public, anon, authenticated;
grant execute on function public.provision_wallet_accounts(text) to service_role;

-- Preserve the ledger's existing validation and atomicity while extending only
-- its currency allow-list. Abort if the installed function differs unexpectedly.
do $$
declare
  v_definition text;
  v_updated text;
begin
  select pg_catalog.pg_get_functiondef(
    'public.post_ledger_transaction(text,text,text,text,text,text,bigint,bigint,jsonb,jsonb)'::regprocedure
  ) into v_definition;
  v_updated := replace(
    v_definition,
    'p_currency not in (''USD'', ''EUR'', ''XOF'')',
    'p_currency not in (''USD'', ''EUR'', ''XOF'', ''GHS'', ''NGN'', ''XAF'', ''CDF'')'
  );
  if v_updated = v_definition then
    raise exception 'Could not extend the installed ledger currency validation safely';
  end if;
  execute v_updated;
end;
$$;

alter table public.mobile_money_operations
  drop constraint if exists mobile_money_operations_country_id_check;
alter table public.mobile_money_operations
  add constraint mobile_money_operations_country_id_check
  check (country_id in (
    'benin', 'cote-divoire', 'senegal', 'burkina-faso', 'mali', 'togo',
    'ghana', 'nigeria', 'cameroon', 'democratic-republic-of-congo'
  ));

alter table public.mobile_money_operations
  drop constraint if exists mobile_money_operations_wallet_currency_check;
alter table public.mobile_money_operations
  add constraint mobile_money_operations_wallet_currency_check
  check (wallet_currency in ('USD', 'EUR', 'XOF', 'GHS', 'NGN', 'XAF', 'CDF'));

alter table public.mobile_money_operations
  add column if not exists source_currency text not null default 'XOF',
  add column if not exists source_amount_minor bigint;

update public.mobile_money_operations
set source_amount_minor = source_amount_xof
where source_amount_minor is null;

alter table public.mobile_money_operations
  alter column source_amount_minor set not null,
  add constraint mobile_money_source_currency_check
    check (source_currency in ('XOF', 'GHS', 'NGN', 'XAF', 'CDF')),
  add constraint mobile_money_source_amount_minor_check
    check (source_amount_minor > 0);

-- Keep request terms immutable, including the newly recorded local source amount.
do $$
declare
  v_definition text;
  v_updated text;
begin
  select pg_catalog.pg_get_functiondef('public.guard_mobile_money_operation_update()'::regprocedure)
    into v_definition;
  v_updated := replace(
    v_definition,
    'or new.source_amount_xof <> old.source_amount_xof',
    'or new.source_amount_xof <> old.source_amount_xof' || E'\n     or new.source_currency <> old.source_currency\n     or new.source_amount_minor <> old.source_amount_minor'
  );
  if v_updated = v_definition then
    raise exception 'Could not extend Mobile Money immutability guard safely';
  end if;
  execute v_updated;
end;
$$;

-- Provider-confirmed local-currency deposit. The credited wallet currency must
-- equal the actual Mobile Money currency; no implicit FX is ever performed.
create or replace function public.settle_mobile_money_local_deposit(
  p_operation_id uuid,
  p_provider_operation_id text,
  p_confirmed_amount_minor bigint,
  p_confirmed_currency text
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
  select * into v_operation from public.mobile_money_operations where id = p_operation_id for update;
  if not found then raise exception 'Mobile Money operation not found' using errcode = 'P0002'; end if;
  if v_operation.direction <> 'deposit'
     or v_operation.provider_id not in ('paydunya', 'pawapay')
     or v_operation.provider_operation_id is distinct from p_provider_operation_id
     or v_operation.source_currency <> p_confirmed_currency
     or v_operation.wallet_currency <> p_confirmed_currency
     or v_operation.source_amount_minor <> p_confirmed_amount_minor
     or v_operation.wallet_amount_minor <> p_confirmed_amount_minor then
    raise exception 'Confirmed deposit does not match the original local-currency request' using errcode = '23514';
  end if;
  if v_operation.status = 'succeeded' then return v_operation.ledger_transaction_id; end if;
  if v_operation.status not in ('created', 'awaiting_authorization', 'processing') then
    raise exception 'Deposit cannot settle from its current state' using errcode = '23514';
  end if;
  perform public.provision_wallet_accounts(v_operation.user_id);
  select id into v_wallet_account_id from public.ledger_accounts
   where owner_user_id = v_operation.user_id and currency = p_confirmed_currency and account_type = 'wallet_liability';
  select id into v_clearing_account_id from public.ledger_accounts
   where account_code = 'system:clearing:' || p_confirmed_currency and account_type = 'clearing_asset';
  v_transaction_id := public.post_ledger_transaction(
    v_operation.user_id, null, 'mobile-money:deposit:' || v_operation.id::text,
    'deposit', v_operation.reference, p_confirmed_currency, p_confirmed_amount_minor, 0,
    jsonb_build_array(
      jsonb_build_object('account_id', v_clearing_account_id, 'side', 'debit', 'amount_minor', p_confirmed_amount_minor),
      jsonb_build_object('account_id', v_wallet_account_id, 'side', 'credit', 'amount_minor', p_confirmed_amount_minor)
    ),
    jsonb_build_object('provider', v_operation.provider_id, 'providerOperationId', p_provider_operation_id,
      'mobileMoneyOperationId', v_operation.id, 'direction', 'deposit', 'sourceCurrency', p_confirmed_currency)
  );
  update public.mobile_money_operations set status = 'succeeded', ledger_transaction_id = v_transaction_id, completed_at = now()
   where id = p_operation_id;
  return v_transaction_id;
end;
$$;

create or replace function public.reserve_mobile_money_local_withdrawal(
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
  select * into v_operation from public.mobile_money_operations where id = p_operation_id for update;
  if not found then raise exception 'Mobile Money operation not found' using errcode = 'P0002'; end if;
  if v_operation.direction <> 'withdrawal'
     or v_operation.provider_id not in ('paydunya', 'pawapay')
     or v_operation.provider_operation_id is distinct from p_provider_operation_id
     or v_operation.wallet_currency <> v_operation.source_currency then
    raise exception 'Withdrawal does not match a local-currency operation' using errcode = '23514';
  end if;
  if v_operation.status = 'processing' and v_operation.ledger_transaction_id is not null then
    return v_operation.ledger_transaction_id;
  end if;
  if v_operation.status <> 'awaiting_authorization' then
    raise exception 'Withdrawal cannot be reserved from its current state' using errcode = '23514';
  end if;
  perform public.provision_wallet_accounts(v_operation.user_id);
  select id into v_wallet_account_id from public.ledger_accounts
   where owner_user_id = v_operation.user_id and currency = v_operation.wallet_currency and account_type = 'wallet_liability';
  select id into v_clearing_account_id from public.ledger_accounts
   where account_code = 'system:clearing:' || v_operation.wallet_currency and account_type = 'clearing_asset';
  v_transaction_id := public.post_ledger_transaction(
    v_operation.user_id, null, 'mobile-money:withdrawal:' || v_operation.id::text,
    'withdrawal', v_operation.reference, v_operation.wallet_currency, v_operation.wallet_amount_minor, 0,
    jsonb_build_array(
      jsonb_build_object('account_id', v_wallet_account_id, 'side', 'debit', 'amount_minor', v_operation.wallet_amount_minor),
      jsonb_build_object('account_id', v_clearing_account_id, 'side', 'credit', 'amount_minor', v_operation.wallet_amount_minor)
    ),
    jsonb_build_object('provider', v_operation.provider_id, 'providerOperationId', p_provider_operation_id,
      'mobileMoneyOperationId', v_operation.id, 'direction', 'withdrawal', 'sourceCurrency', v_operation.source_currency)
  );
  update public.mobile_money_operations set status = 'processing', ledger_transaction_id = v_transaction_id
   where id = p_operation_id;
  return v_transaction_id;
end;
$$;

create or replace function public.settle_mobile_money_local_withdrawal(
  p_operation_id uuid,
  p_provider_operation_id text,
  p_confirmed_amount_minor bigint,
  p_confirmed_currency text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_operation public.mobile_money_operations%rowtype;
begin
  select * into v_operation from public.mobile_money_operations where id = p_operation_id for update;
  if not found then raise exception 'Mobile Money operation not found' using errcode = 'P0002'; end if;
  if v_operation.direction <> 'withdrawal'
     or v_operation.provider_id not in ('paydunya', 'pawapay')
     or v_operation.provider_operation_id is distinct from p_provider_operation_id
     or v_operation.source_currency <> p_confirmed_currency
     or v_operation.source_amount_minor <> p_confirmed_amount_minor then
    raise exception 'Confirmed payout does not match the original request' using errcode = '23514';
  end if;
  if v_operation.status = 'succeeded' then return v_operation.ledger_transaction_id; end if;
  if v_operation.status <> 'processing' or v_operation.ledger_transaction_id is null then
    raise exception 'Withdrawal is not awaiting provider settlement' using errcode = '23514';
  end if;
  update public.mobile_money_operations set status = 'succeeded', completed_at = now() where id = p_operation_id;
  return v_operation.ledger_transaction_id;
end;
$$;

create or replace function public.fail_mobile_money_local_withdrawal(
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
  select * into v_operation from public.mobile_money_operations where id = p_operation_id for update;
  if not found then raise exception 'Mobile Money operation not found' using errcode = 'P0002'; end if;
  if v_operation.direction <> 'withdrawal'
     or v_operation.provider_id not in ('paydunya', 'pawapay')
     or v_operation.provider_operation_id is distinct from p_provider_operation_id then
    raise exception 'Withdrawal does not match' using errcode = '23514';
  end if;
  if v_operation.status = 'failed' then return v_operation.refund_ledger_transaction_id; end if;
  if v_operation.status not in ('created', 'awaiting_authorization', 'processing') then
    raise exception 'Withdrawal cannot fail from its current state' using errcode = '23514';
  end if;
  if v_operation.status = 'processing' then
    select id into v_wallet_account_id from public.ledger_accounts
     where owner_user_id = v_operation.user_id and currency = v_operation.wallet_currency and account_type = 'wallet_liability';
    select id into v_clearing_account_id from public.ledger_accounts
     where account_code = 'system:clearing:' || v_operation.wallet_currency and account_type = 'clearing_asset';
    v_refund_transaction_id := public.post_ledger_transaction(
      v_operation.user_id, null, 'mobile-money:withdrawal-refund:' || v_operation.id::text,
      'refund', v_operation.reference || '-REFUND', v_operation.wallet_currency, v_operation.wallet_amount_minor, 0,
      jsonb_build_array(
        jsonb_build_object('account_id', v_clearing_account_id, 'side', 'debit', 'amount_minor', v_operation.wallet_amount_minor),
        jsonb_build_object('account_id', v_wallet_account_id, 'side', 'credit', 'amount_minor', v_operation.wallet_amount_minor)
      ),
      jsonb_build_object('provider', v_operation.provider_id, 'providerOperationId', p_provider_operation_id,
        'mobileMoneyOperationId', v_operation.id, 'direction', 'withdrawal_refund', 'sourceCurrency', v_operation.source_currency)
    );
  end if;
  update public.mobile_money_operations
   set status = 'failed', refund_ledger_transaction_id = v_refund_transaction_id,
       failure_code = left(coalesce(p_failure_code, 'provider_failed'), 80),
       failure_message = 'Mobile Money provider did not complete the payout.'
   where id = p_operation_id;
  return v_refund_transaction_id;
end;
$$;

revoke all on function public.settle_mobile_money_local_deposit(uuid,text,bigint,text) from public, anon, authenticated;
revoke all on function public.reserve_mobile_money_local_withdrawal(uuid,text) from public, anon, authenticated;
revoke all on function public.settle_mobile_money_local_withdrawal(uuid,text,bigint,text) from public, anon, authenticated;
revoke all on function public.fail_mobile_money_local_withdrawal(uuid,text,text) from public, anon, authenticated;
grant execute on function public.settle_mobile_money_local_deposit(uuid,text,bigint,text) to service_role;
grant execute on function public.reserve_mobile_money_local_withdrawal(uuid,text) to service_role;
grant execute on function public.settle_mobile_money_local_withdrawal(uuid,text,bigint,text) to service_role;
grant execute on function public.fail_mobile_money_local_withdrawal(uuid,text,text) to service_role;
