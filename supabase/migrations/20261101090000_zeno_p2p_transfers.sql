-- Server-verified transaction PINs and atomic, fee-free ZENO-to-ZENO transfers.

create table if not exists public.user_security_pins (
  user_id text primary key,
  salt text not null,
  pin_hash text not null,
  failed_attempts smallint not null default 0 check (failed_attempts between 0 and 5),
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_security_pins enable row level security;
revoke all on public.user_security_pins from public, anon, authenticated;
grant select, insert, update on public.user_security_pins to service_role;

create or replace function public.record_pin_failure(p_user_id text)
returns table (failed_attempts smallint, locked_until timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.user_security_pins pin
  set failed_attempts = least(pin.failed_attempts + 1, 5)::smallint,
      locked_until = case
        when pin.failed_attempts + 1 >= 5 then now() + interval '15 minutes'
        else pin.locked_until
      end,
      updated_at = now()
  where pin.user_id = p_user_id
  returning pin.failed_attempts, pin.locked_until;
end;
$$;

create or replace function public.reset_pin_failures(p_user_id text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.user_security_pins
  set failed_attempts = 0, locked_until = null, updated_at = now()
  where user_id = p_user_id;
$$;

revoke all on function public.record_pin_failure(text) from public, anon, authenticated;
revoke all on function public.reset_pin_failures(text) from public, anon, authenticated;
grant execute on function public.record_pin_failure(text) to service_role;
grant execute on function public.reset_pin_failures(text) to service_role;

-- This function builds the only allowed P2P posting shape itself. The API does
-- not get arbitrary account IDs and cannot choose a client-supplied fee.
create or replace function public.transfer_zeno_wallet(
  p_sender_user_id text,
  p_recipient_user_id text,
  p_idempotency_key text,
  p_reference text,
  p_currency text,
  p_amount_minor bigint,
  p_sender_name text,
  p_recipient_name text
)
returns table (transaction_id uuid, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sender_account uuid;
  v_recipient_account uuid;
  v_transaction_id uuid;
  v_created_at timestamptz;
begin
  if p_sender_user_id is null or p_recipient_user_id is null
     or p_sender_user_id = p_recipient_user_id then
    raise exception 'Invalid transfer participants' using errcode = '22023';
  end if;
  if p_currency is null or p_currency not in ('USD', 'EUR', 'XOF')
     or p_amount_minor is null or p_amount_minor <= 0 then
    raise exception 'Invalid transfer amount' using errcode = '22023';
  end if;

  perform public.provision_wallet_accounts(p_sender_user_id);
  perform public.provision_wallet_accounts(p_recipient_user_id);

  select id into v_sender_account
  from public.ledger_accounts
  where owner_user_id = p_sender_user_id
    and currency = p_currency
    and account_type = 'wallet_liability';

  select id into v_recipient_account
  from public.ledger_accounts
  where owner_user_id = p_recipient_user_id
    and currency = p_currency
    and account_type = 'wallet_liability';

  if v_sender_account is null or v_recipient_account is null then
    raise exception 'Wallet account could not be provisioned' using errcode = '23514';
  end if;

  v_transaction_id := public.post_ledger_transaction(
    p_sender_user_id,
    p_recipient_user_id,
    p_idempotency_key,
    'p2p_transfer',
    p_reference,
    p_currency,
    p_amount_minor,
    0,
    jsonb_build_array(
      jsonb_build_object('account_id', v_sender_account, 'side', 'debit', 'amount_minor', p_amount_minor),
      jsonb_build_object('account_id', v_recipient_account, 'side', 'credit', 'amount_minor', p_amount_minor)
    ),
    jsonb_build_object(
      'senderName', coalesce(nullif(trim(p_sender_name), ''), 'ZENO User'),
      'recipientName', coalesce(nullif(trim(p_recipient_name), ''), 'ZENO User'),
      'paymentMethod', 'ZENO Wallet'
    )
  );

  select tx.created_at into v_created_at
  from public.ledger_transactions tx
  where tx.id = v_transaction_id;

  return query select v_transaction_id, v_created_at;
end;
$$;

revoke all on function public.transfer_zeno_wallet(text, text, text, text, text, bigint, text, text)
  from public, anon, authenticated;
grant execute on function public.transfer_zeno_wallet(text, text, text, text, text, bigint, text, text)
  to service_role;
