-- =========================================================
-- MIGRATION: add idempotency key to public.expenses
-- Purpose:
--   Prevent the same client save operation from creating
--   more than one expense for the same authenticated user.
--
-- Existing rows are preserved with client_request_id = null.
-- =========================================================

begin;

alter table public.expenses
  add column client_request_id uuid null;

comment on column public.expenses.client_request_id is
  'Client-generated UUID used to make expense creation idempotent.';

create unique index expenses_user_client_request_id_uidx
  on public.expenses (
    user_id,
    client_request_id
  )
  where client_request_id is not null;

commit;
