-- Durable Mobile Money operation state, separate from the immutable ledger.
-- Pending provider operations are not wallet balance changes. Only a verified
-- provider event may move an operation to a terminal state and post ledger rows.

create table if not exists public.mobile_money_operations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  idempotency_key text not null,
  direction text not null check (direction in ('deposit', 'withdrawal')),
  status text not null check (
    status in ('created', 'awaiting_authorization', 'processing', 'succeeded', 'failed', 'expired')
  ),
  country_id text not null check (country_id in ('benin', 'cote-divoire')),
  provider_id text not null,
  provider_operation_id text,
  reference text not null unique,
  phone_number text not null,
  contact_name text,
  source_amount_xof bigint not null check (source_amount_xof > 0),
  wallet_currency text not null check (wallet_currency in ('USD', 'EUR', 'XOF')),
  wallet_amount_minor bigint not null check (wallet_amount_minor > 0),
  exchange_rate numeric(24, 12) not null check (exchange_rate > 0),
  zeno_fee_minor bigint not null default 0 check (zeno_fee_minor = 0),
  provider_fee_xof bigint check (provider_fee_xof is null or provider_fee_xof >= 0),
  ledger_transaction_id uuid references public.ledger_transactions(id) on delete restrict,
  failure_code text,
  failure_message text,
  request_fingerprint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint mobile_money_idempotency unique (user_id, idempotency_key),
  constraint mobile_money_provider_operation unique (provider_id, provider_operation_id),
  constraint mobile_money_terminal_consistency check (
    (status = 'succeeded' and ledger_transaction_id is not null and completed_at is not null)
    or (status <> 'succeeded' and ledger_transaction_id is null and completed_at is null)
  )
);

create index if not exists mobile_money_user_created
  on public.mobile_money_operations (user_id, created_at desc);
create index if not exists mobile_money_pending
  on public.mobile_money_operations (created_at)
  where status in ('created', 'awaiting_authorization', 'processing');

create or replace function public.guard_mobile_money_operation_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id
     or new.user_id <> old.user_id
     or new.idempotency_key <> old.idempotency_key
     or new.direction <> old.direction
     or new.country_id <> old.country_id
     or new.provider_id <> old.provider_id
     or new.reference <> old.reference
     or new.phone_number <> old.phone_number
     or new.source_amount_xof <> old.source_amount_xof
     or new.wallet_currency <> old.wallet_currency
     or new.wallet_amount_minor <> old.wallet_amount_minor
     or new.exchange_rate <> old.exchange_rate
     or new.zeno_fee_minor <> old.zeno_fee_minor
     or new.request_fingerprint <> old.request_fingerprint then
    raise exception 'Mobile Money request details are immutable' using errcode = '55000';
  end if;

  if old.status in ('succeeded', 'failed', 'expired') then
    raise exception 'Terminal Mobile Money operations are immutable' using errcode = '55000';
  end if;
  if new.status <> old.status and not (
    (old.status = 'created' and new.status in ('awaiting_authorization', 'failed', 'expired'))
    or (old.status = 'awaiting_authorization' and new.status in ('processing', 'succeeded', 'failed', 'expired'))
    or (old.status = 'processing' and new.status in ('succeeded', 'failed', 'expired'))
  ) then
    raise exception 'Invalid Mobile Money operation state transition' using errcode = '23514';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists mobile_money_operation_update_guard on public.mobile_money_operations;
create trigger mobile_money_operation_update_guard
  before update on public.mobile_money_operations
  for each row execute function public.guard_mobile_money_operation_update();

-- Webhook event ids are unique per provider. Keep only a hash and a minimal,
-- redacted event envelope; provider payloads can contain phone and metadata.
create table if not exists public.mobile_money_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null,
  provider_event_id text not null,
  operation_id uuid references public.mobile_money_operations(id) on delete restrict,
  event_type text not null,
  payload_sha256 text not null,
  signature_verified boolean not null,
  processing_status text not null default 'received'
    check (processing_status in ('received', 'processed', 'ignored', 'failed')),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  constraint mobile_money_webhook_event_once unique (provider_id, provider_event_id)
);

alter table public.mobile_money_operations enable row level security;
alter table public.mobile_money_webhook_events enable row level security;
revoke all on public.mobile_money_operations from public, anon, authenticated, service_role;
revoke all on public.mobile_money_webhook_events from public, anon, authenticated, service_role;
grant select on public.mobile_money_operations to authenticated;
grant insert, update, select on public.mobile_money_operations to service_role;
grant select on public.mobile_money_webhook_events to service_role;
grant insert, update on public.mobile_money_webhook_events to service_role;

drop policy if exists mobile_money_operations_read_own on public.mobile_money_operations;
create policy mobile_money_operations_read_own
  on public.mobile_money_operations for select to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'));

comment on table public.mobile_money_operations is
  'Provider operation lifecycle. Pending rows are not ledger postings; successful operations must reference an immutable ledger transaction.';
comment on table public.mobile_money_webhook_events is
  'Deduplicated, redacted webhook audit envelope. Never stores raw provider payloads or secrets.';
