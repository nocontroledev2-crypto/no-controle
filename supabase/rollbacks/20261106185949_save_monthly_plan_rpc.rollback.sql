-- Rollback for:
-- 20261106185949_save_monthly_plan_rpc.sql
--
-- Removes only the transactional monthly plan save RPC.
-- Does not modify monthly plans, goals or expenses.

begin;

drop function if exists
  public.save_monthly_plan(
    integer,
    integer,
    numeric,
    text,
    jsonb
  );

commit;
