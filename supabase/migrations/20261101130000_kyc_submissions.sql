-- Provider-neutral KYC audit state. Identity photos are not stored in these tables.

create table if not exists public.kyc_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  idempotency_key text not null,
  provider text not null check (provider in ('didit', 'aiprise')),
  provider_job_id text not null unique,
  provider_reference text,
  country_id text not null check (country_id in ('benin', 'cote-divoire')),
  document_type text not null check (document_type in ('national_id', 'passport', 'drivers_license', 'provider_selected')),
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected', 'failed')),
  result_code text,
  result_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint kyc_user_idempotency unique (user_id, idempotency_key),
  constraint kyc_decision_consistency check (
    (status = 'pending' and decided_at is null)
    or (status in ('verified', 'rejected', 'failed') and decided_at is not null)
  )
);

create unique index if not exists kyc_one_pending_submission_per_user
  on public.kyc_submissions (user_id)
  where status = 'pending';
create index if not exists kyc_user_created
  on public.kyc_submissions (user_id, created_at desc);

create table if not exists public.kyc_provider_events (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.kyc_submissions(id) on delete restrict,
  event_fingerprint text not null,
  result_code text not null,
  signature_verified boolean not null,
  received_at timestamptz not null default now(),
  constraint kyc_provider_event_once unique (submission_id, event_fingerprint)
);

alter table public.kyc_submissions enable row level security;
alter table public.kyc_provider_events enable row level security;
revoke all on public.kyc_submissions from public, anon, authenticated, service_role;
revoke all on public.kyc_provider_events from public, anon, authenticated, service_role;
grant select on public.kyc_submissions to authenticated;
grant insert, update, select on public.kyc_submissions to service_role;
grant insert, select on public.kyc_provider_events to service_role;

drop policy if exists kyc_submissions_read_own on public.kyc_submissions;
create policy kyc_submissions_read_own
  on public.kyc_submissions for select to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'));

drop policy if exists kyc_provider_events_read_none on public.kyc_provider_events;
create policy kyc_provider_events_read_none
  on public.kyc_provider_events for select to authenticated
  using (false);

create or replace function public.guard_kyc_submission_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id
     or new.user_id <> old.user_id
     or new.idempotency_key <> old.idempotency_key
     or new.provider <> old.provider
     or new.provider_job_id <> old.provider_job_id
     or new.country_id <> old.country_id
     or new.document_type <> old.document_type
     or new.created_at <> old.created_at then
    raise exception 'KYC submission identity is immutable' using errcode = '55000';
  end if;
  if old.status <> 'pending' and new.status <> old.status then
    raise exception 'Final KYC decisions are immutable' using errcode = '55000';
  end if;
  if new.status <> old.status and new.status not in ('verified', 'rejected', 'failed') then
    raise exception 'Invalid KYC decision transition' using errcode = '23514';
  end if;
  if old.status = 'pending' and new.status in ('verified', 'rejected', 'failed') and new.decided_at is null then
    new.decided_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists kyc_submission_update_guard on public.kyc_submissions;
create trigger kyc_submission_update_guard
  before update on public.kyc_submissions
  for each row execute function public.guard_kyc_submission_update();

comment on table public.kyc_submissions is
  'Minimal KYC status and provider reference. Do not store identity images, document numbers, or full provider responses here.';
comment on table public.kyc_provider_events is
  'Deduplicated KYC callback audit hashes. Provider signatures must be verified before insertion.';
