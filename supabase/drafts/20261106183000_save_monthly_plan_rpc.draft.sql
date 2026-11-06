-- DRAFT ONLY - NOT EXECUTED.
-- Transactional RPC for saving one monthly plan
-- and synchronizing all positive category goals.
--
-- Requires review, isolated tests and explicit approval
-- before promotion to supabase/migrations.

create or replace function public.save_monthly_plan(
  target_year integer,
  target_month integer,
  target_spending_limit numeric,
  target_status text,
  target_goals jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid;
  saved_plan_id uuid;
  invalid_goal_count integer;
  duplicate_goal_count integer;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception
      'Authenticated user required.';
  end if;

  if (
    target_year is null
    or target_year < 2000
    or target_year > 2100
  ) then
    raise exception
      'Invalid planning year.';
  end if;

  if (
    target_month is null
    or target_month < 1
    or target_month > 12
  ) then
    raise exception
      'Invalid planning month.';
  end if;

  if (
    target_spending_limit is null
    or target_spending_limit < 0
  ) then
    raise exception
      'Invalid monthly spending limit.';
  end if;

  if (
    target_status is null
    or target_status not in (
      'draft',
      'active'
    )
  ) then
    raise exception
      'Invalid planning status.';
  end if;

  if (
    target_goals is null
    or jsonb_typeof(target_goals) <> 'array'
  ) then
    raise exception
      'Planning goals must be an array.';
  end if;

  select count(*)
  into invalid_goal_count
  from jsonb_to_recordset(target_goals)
    as goal(
      category text,
      planned_amount numeric
    )
  where
    goal.category is null
    or goal.category not in (
      'Moradia',
      'Contas da Casa',
      'Alimentação',
      'Assinaturas',
      'Transporte',
      'Saúde',
      'Educação',
      'Lazer',
      'Compras',
      'Serviços',
      'Pets',
      'Família',
      'Financeiro',
      'Outros'
    )
    or goal.planned_amount is null
    or goal.planned_amount <= 0;

  if invalid_goal_count > 0 then
    raise exception
      'Invalid planning goal.';
  end if;

  select count(*)
  into duplicate_goal_count
  from (
    select goal.category
    from jsonb_to_recordset(target_goals)
      as goal(
        category text,
        planned_amount numeric
      )
    group by goal.category
    having count(*) > 1
  ) duplicates;

  if duplicate_goal_count > 0 then
    raise exception
      'Duplicate planning category.';
  end if;

  insert into public.monthly_plans (
    user_id,
    year,
    month,
    spending_limit,
    status
  )
  values (
    current_user_id,
    target_year,
    target_month,
    round(target_spending_limit, 2),
    target_status
  )
  on conflict (
    user_id,
    year,
    month
  )
  do update set
    spending_limit =
      excluded.spending_limit,
    status =
      excluded.status
  returning id
  into saved_plan_id;

  delete from public.monthly_plan_goals
  where plan_id = saved_plan_id
    and category not in (
      select goal.category
      from jsonb_to_recordset(target_goals)
        as goal(
          category text,
          planned_amount numeric
        )
    );

  insert into public.monthly_plan_goals (
    plan_id,
    category,
    planned_amount
  )
  select
    saved_plan_id,
    goal.category,
    round(goal.planned_amount, 2)
  from jsonb_to_recordset(target_goals)
    as goal(
      category text,
      planned_amount numeric
    )
  on conflict (
    plan_id,
    category
  )
  do update set
    planned_amount =
      excluded.planned_amount;

  return saved_plan_id;
end;
$$;

revoke all
on function public.save_monthly_plan(
  integer,
  integer,
  numeric,
  text,
  jsonb
)
from public;

revoke all
on function public.save_monthly_plan(
  integer,
  integer,
  numeric,
  text,
  jsonb
)
from anon;

grant execute
on function public.save_monthly_plan(
  integer,
  integer,
  numeric,
  text,
  jsonb
)
to authenticated;
