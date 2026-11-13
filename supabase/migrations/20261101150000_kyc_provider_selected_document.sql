alter table public.kyc_submissions
  drop constraint if exists kyc_submissions_document_type_check;

alter table public.kyc_submissions
  add constraint kyc_submissions_document_type_check
  check (document_type in ('national_id', 'passport', 'drivers_license', 'provider_selected'));
