-- ZENO financial source of truth.
-- All amounts are integer minor units: USD/EUR use cents; XOF uses whole francs.
-- Mobile clients can read their own wallet/activity rows, but cannot write ledger data.

create table if not exists public.ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id text,
  account_code text not null unique,
  account_type text not null check (
    account_type in ('wallet_liability', 'clearing_asset', 'fee_revenue')
  ),
  currency text not null check (currency in ('USD', 'EUR', 'XOF')),
  created_at timestamptz not null default now(),
  constraint ledger_accounts_owner_by_type check (
    (account_type = 'wallet_liability' and owner_user_id is not null)
    or (account_type <> 'wallet_liability' and owner_user_id is null)
  )
);

create unique index if not exists ledger_accounts_wallet_per_currency
  on public.ledger_accounts (owner_user_id, currency)
  where account_type = 'wallet_liability';

create table if not exists public.ledger_transactions (
  id uuid primary key default gen_random_uuid(),
  initiated_by_user_id text not null,
  counterparty_user_id text,
  idempotency_key text not null,
  kind text not null check (
    kind in (
      'deposit',
      'withdrawal',
      'p2p_transfer',
      'card_top_up',
      'card_purchase',
      'payment',
      'fee',
      'refund',
      'adjustment'
    )
  ),
  reference text,
  currency text not null check (currency in ('USD', 'EUR', 'XOF')),
  amount_minor bigint not null check (amount_minor > 0),
  fee_minor bigint not null default 0 check (fee_minor >= 0),
  request_payload jsonb not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ledger_transactions_idempotency unique (initiated_by_user_id, idempotency_key),
  constraint ledger_transactions_reference unique (reference),
  constraint ledger_transactions_no_self_transfer check (
    counterparty_user_id is null or counterparty_user_id <> initiated_by_user_id
  )
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.ledger_transactions(id) on delete restrict,
  account_id uuid not null references public.ledger_accounts(id) on delete restrict,
  side text not null check (side in ('debit', 'credit')),
  amount_minor bigint not null check (amount_minor > 0),
  created_at timestamptz not null default now()
);

create index if not exists ledger_entries_account_created
  on public.ledger_entries (account_id, created_at desc);
create index if not exists ledger_entries_transaction
  on public.ledger_entries (transaction_id);
create index if not exists ledger_transactions_initiator_created
  on public.ledger_transactions (initiated_by_user_id, created_at desc);
create index if not exists ledger_transactions_counterparty_created
  on public.ledger_transactions (counterparty_user_id, created_at desc)
  where counterparty_user_id is not null;

-- System counterpart accounts make each currency balance independently.
insert into public.ledger_accounts (owner_user_id, account_code, account_type, currency)
values
  (null, 'system:clearing:USD', 'clearing_asset', 'USD'),
  (null, 'system:clearing:EUR', 'clearing_asset', 'EUR'),
  (null, 'system:clearing:XOF', 'clearing_asset', 'XOF'),
  (null, 'system:fees:USD', 'fee_revenue', 'USD'),
  (null, 'system:fees:EUR', 'fee_revenue', 'EUR'),
  (null, 'system:fees:XOF', 'fee_revenue', 'XOF')
on conflict (account_code) do nothing;

create or replace function public.reject_ledger_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Posted ledger history is immutable; create a compensating transaction instead'
    using errcode = '55000';
end;
$$;

drop trigger if exists ledger_transactions_immutable on public.ledger_transactions;
create trigger ledger_transactions_immutable
  before update or delete on public.ledger_transactions
  for each row execute function public.reject_ledger_mutation();

drop trigger if exists ledger_entries_immutable on public.ledger_entries;
create trigger ledger_entries_immutable
  before update or delete on public.ledger_entries
  for each row execute function public.reject_ledger_mutation();

alter table public.ledger_accounts enable row level security;
alter table public.ledger_transactions enable row level security;
alter table public.ledger_entries enable row level security;

drop policy if exists ledger_accounts_read_own on public.ledger_accounts;
create policy ledger_accounts_read_own
  on public.ledger_accounts for select to authenticated
  using (owner_user_id = (select auth.jwt() ->> 'sub'));

drop policy if exists ledger_transactions_read_participant on public.ledger_transactions;
create policy ledger_transactions_read_participant
  on public.ledger_transactions for select to authenticated
  using (
    initiated_by_user_id = (select auth.jwt() ->> 'sub')
    or counterparty_user_id = (select auth.jwt() ->> 'sub')
  );

drop policy if exists ledger_entries_read_own_wallets on public.ledger_entries;
create policy ledger_entries_read_own_wallets
  on public.ledger_entries for select to authenticated
  using (
    exists (
      select 1
      from public.ledger_accounts account
      where account.id = ledger_entries.account_id
        and account.account_type = 'wallet_liability'
        and account.owner_user_id = (select auth.jwt() ->> 'sub')
    )
  );

-- Even the server role posts through the guarded function, never by table writes.
revoke all on public.ledger_accounts from anon, authenticated, service_role;
revoke all on public.ledger_transactions from anon, authenticated, service_role;
revoke all on public.ledger_entries from anon, authenticated, service_role;
grant select on public.ledger_accounts to authenticated;
grant select on public.ledger_transactions to authenticated;
grant select on public.ledger_entries to authenticated;

create or replace view public.wallet_balances
with (security_invoker = true)
as
select
  account.id as wallet_id,
  account.owner_user_id,
  account.currency,
  coalesce(
    sum(case entry.side when 'credit' then entry.amount_minor else -entry.amount_minor end),
    0
  )::bigint as balance_minor
from public.ledger_accounts account
left join public.ledger_entries entry on entry.account_id = account.id
where account.account_type = 'wallet_liability'
group by account.id, account.owner_user_id, account.currency;

grant select on public.wallet_balances to authenticated;

create or replace view public.wallet_activity
with (security_invoker = true)
as
select
  tx.id,
  account.owner_user_id,
  tx.kind,
  tx.reference,
  tx.currency,
  tx.amount_minor,
  tx.fee_minor,
  case
    when sum(case entry.side when 'credit' then entry.amount_minor else -entry.amount_minor end) > 0
      then 'in'
    else 'out'
  end as direction,
  tx.initiated_by_user_id,
  tx.counterparty_user_id,
  tx.metadata,
  tx.created_at
from public.ledger_transactions tx
join public.ledger_entries entry on entry.transaction_id = tx.id
join public.ledger_accounts account
  on account.id = entry.account_id
  and account.account_type = 'wallet_liability'
group by tx.id, account.id;

grant select on public.wallet_activity to authenticated;

-- Provision zero-balance accounts once a Clerk user reaches the backend.
-- The caller must be a trusted server function, never the mobile client.
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
  select
    p_user_id,
    'wallet:' || p_user_id || ':' || currency_code,
    'wallet_liability',
    currency_code
  from unnest(array['USD', 'EUR', 'XOF']::text[]) as currency_list(currency_code)
  on conflict (owner_user_id, currency)
    where account_type = 'wallet_liability'
    do nothing;
end;
$$;

revoke all on function public.provision_wallet_accounts(text) from public, anon, authenticated;
grant execute on function public.provision_wallet_accounts(text) to service_role;

-- The only ledger writer. It posts all entries atomically, validates that each
-- currency balances, prevents wallet overdrafts, and makes retries idempotent.
create or replace function public.post_ledger_transaction(
  p_initiated_by_user_id text,
  p_counterparty_user_id text,
  p_idempotency_key text,
  p_kind text,
  p_reference text,
  p_currency text,
  p_amount_minor bigint,
  p_fee_minor bigint,
  p_entries jsonb,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request_payload jsonb;
  v_existing_id uuid;
  v_existing_payload jsonb;
  v_transaction_id uuid;
  v_input_count integer;
  v_account_count integer;
begin
  if p_initiated_by_user_id is null or length(trim(p_initiated_by_user_id)) < 3
     or length(p_initiated_by_user_id) > 255 then
    raise exception 'Invalid actor' using errcode = '22023';
  end if;
  if p_counterparty_user_id = p_initiated_by_user_id then
    raise exception 'Self transfers are not allowed' using errcode = '22023';
  end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 8
     or length(p_idempotency_key) > 128 then
    raise exception 'Invalid idempotency key' using errcode = '22023';
  end if;

  -- Serialize retries before checking balance so a duplicate debit returns its
  -- original transaction even when the first attempt used the remaining funds.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_initiated_by_user_id || ':' || p_idempotency_key, 0)
  );
  if p_kind is null or p_kind not in (
    'deposit', 'withdrawal', 'p2p_transfer', 'card_top_up',
    'card_purchase', 'payment', 'fee', 'refund', 'adjustment'
  ) then
    raise exception 'Unsupported transaction kind' using errcode = '22023';
  end if;
  if p_currency is null or p_currency not in ('USD', 'EUR', 'XOF')
     or p_amount_minor is null or p_amount_minor <= 0
     or p_fee_minor is null or p_fee_minor < 0 then
    raise exception 'Invalid transaction amount' using errcode = '22023';
  end if;
  if p_entries is null or jsonb_typeof(p_entries) <> 'array' then
    raise exception 'At least two ledger entries are required' using errcode = '22023';
  end if;
  if jsonb_array_length(p_entries) < 2 then
    raise exception 'At least two ledger entries are required' using errcode = '22023';
  end if;

  v_request_payload := jsonb_build_object(
    'initiated_by_user_id', p_initiated_by_user_id,
    'counterparty_user_id', p_counterparty_user_id,
    'kind', p_kind,
    'reference', p_reference,
    'currency', p_currency,
    'amount_minor', p_amount_minor,
    'fee_minor', p_fee_minor,
    'entries', p_entries,
    'metadata', coalesce(p_metadata, '{}'::jsonb)
  );

  select id, request_payload
    into v_existing_id, v_existing_payload
    from public.ledger_transactions
    where initiated_by_user_id = p_initiated_by_user_id
      and idempotency_key = p_idempotency_key;
  if found then
    if v_existing_payload <> v_request_payload then
      raise exception 'Idempotency key was already used for a different request' using errcode = '23505';
    end if;
    return v_existing_id;
  end if;

  -- Parse and validate untrusted JSON before making any write.
  if exists (
    select 1
    from jsonb_array_elements(p_entries) item
    where jsonb_typeof(item) <> 'object'
       or item ->> 'account_id' is null
       or item ->> 'side' not in ('debit', 'credit')
       or coalesce(item ->> 'amount_minor', '') !~ '^[1-9][0-9]{0,17}$'
  ) then
    raise exception 'Invalid ledger entry' using errcode = '22023';
  end if;

  select count(*) into v_input_count
    from (
      select distinct (item ->> 'account_id')::uuid as account_id
      from jsonb_array_elements(p_entries) item
    ) input_accounts;

  -- Lock accounts in a stable order to avoid transfer deadlocks.
  perform account.id
    from public.ledger_accounts account
    join (
      select distinct (item ->> 'account_id')::uuid as account_id
      from jsonb_array_elements(p_entries) item
    ) input_accounts on input_accounts.account_id = account.id
    order by account.id
    for update of account;

  select count(*) into v_account_count
    from public.ledger_accounts account
    join (
      select distinct (item ->> 'account_id')::uuid as account_id
      from jsonb_array_elements(p_entries) item
    ) input_accounts on input_accounts.account_id = account.id;
  if v_account_count <> v_input_count then
    raise exception 'Unknown ledger account' using errcode = '22023';
  end if;

  if exists (
    select account.currency
    from jsonb_array_elements(p_entries) item
    join public.ledger_accounts account on account.id = (item ->> 'account_id')::uuid
    group by account.currency
    having sum(
      case item ->> 'side'
        when 'debit' then (item ->> 'amount_minor')::bigint
        else -((item ->> 'amount_minor')::bigint)
      end
    ) <> 0
  ) then
    raise exception 'Ledger entries must balance for each currency' using errcode = '23514';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_entries) item
    join public.ledger_accounts account on account.id = (item ->> 'account_id')::uuid
    where account.currency <> p_currency
  ) then
    raise exception 'All ledger entries must use the transaction currency' using errcode = '23514';
  end if;

  if not exists (
    select 1
    from jsonb_array_elements(p_entries) item
    join public.ledger_accounts account on account.id = (item ->> 'account_id')::uuid
    where account.account_type = 'wallet_liability'
      and account.owner_user_id = p_initiated_by_user_id
  ) then
    raise exception 'Actor wallet is missing from the ledger entries' using errcode = '23514';
  end if;

  if exists (
    with requested as (
      select
        account.id,
        account.account_type,
        sum(case item ->> 'side'
          when 'credit' then (item ->> 'amount_minor')::bigint
          else -((item ->> 'amount_minor')::bigint)
        end) as delta_minor
      from jsonb_array_elements(p_entries) item
      join public.ledger_accounts account on account.id = (item ->> 'account_id')::uuid
      group by account.id, account.account_type
    ), current_balances as (
      select
        account.id,
        coalesce(sum(case entry.side when 'credit' then entry.amount_minor else -entry.amount_minor end), 0) as balance_minor
      from public.ledger_accounts account
      left join public.ledger_entries entry on entry.account_id = account.id
      where account.id in (select id from requested where account_type = 'wallet_liability')
      group by account.id
    )
    select 1
    from requested
    join current_balances using (id)
    where requested.account_type = 'wallet_liability'
      and current_balances.balance_minor + requested.delta_minor < 0
  ) then
    raise exception 'Insufficient wallet balance' using errcode = '23514';
  end if;

  insert into public.ledger_transactions (
    initiated_by_user_id,
    counterparty_user_id,
    idempotency_key,
    kind,
    reference,
    currency,
    amount_minor,
    fee_minor,
    request_payload,
    metadata
  ) values (
    p_initiated_by_user_id,
    p_counterparty_user_id,
    p_idempotency_key,
    p_kind,
    p_reference,
    p_currency,
    p_amount_minor,
    p_fee_minor,
    v_request_payload,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (initiated_by_user_id, idempotency_key) do nothing
  returning id into v_transaction_id;

  if v_transaction_id is null then
    select id, request_payload
      into v_existing_id, v_existing_payload
      from public.ledger_transactions
      where initiated_by_user_id = p_initiated_by_user_id
        and idempotency_key = p_idempotency_key
      for update;
    if v_existing_payload <> v_request_payload then
      raise exception 'Idempotency key was already used for a different request' using errcode = '23505';
    end if;
    return v_existing_id;
  end if;

  insert into public.ledger_entries (transaction_id, account_id, side, amount_minor)
  select
    v_transaction_id,
    (item ->> 'account_id')::uuid,
    item ->> 'side',
    (item ->> 'amount_minor')::bigint
  from jsonb_array_elements(p_entries) item;

  return v_transaction_id;
end;
$$;

revoke all on function public.post_ledger_transaction(
  text, text, text, text, text, text, bigint, bigint, jsonb, jsonb
) from public, anon, authenticated;
grant execute on function public.post_ledger_transaction(
  text, text, text, text, text, text, bigint, bigint, jsonb, jsonb
) to service_role;

comment on table public.ledger_transactions is
  'Immutable financial transaction headers. Reversals must be new transactions; never delete or edit posted history.';
comment on table public.ledger_entries is
  'Append-only double-entry postings in currency minor units. Only trusted server functions may insert.';
