-- Rollback for:
-- 20261106002018_create_monthly_plans.sql
--
-- Removes only the monthly plan database objects.
-- Does not modify expenses, profiles or auth.users.

begin;

drop table if exists public.monthly_plan_goals
  cascade;

drop table if exists public.monthly_plans
  cascade;

drop function if exists
  public.set_monthly_plan_updated_at();

commit;
