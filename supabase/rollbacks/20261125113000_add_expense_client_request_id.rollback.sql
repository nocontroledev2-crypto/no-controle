-- =========================================================
-- ROLLBACK: remove expense idempotency structure
--
-- WARNING:
--   Run only if rollback is consciously required.
--   This removes the new operation identifiers.
-- =========================================================

begin;

drop index
  public.expenses_user_client_request_id_uidx;

alter table public.expenses
  drop column client_request_id;

commit;
