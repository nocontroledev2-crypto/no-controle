-- DRAFT ONLY - NOT EXECUTED.
-- Do not apply to Preview or Production.
-- Requires an isolated Supabase environment, RLS tests,
-- backup strategy and explicit approval before promotion.
-- To become executable, this file must be reviewed again
-- and intentionally moved to supabase/migrations.

begin;

create table if not exists public.monthly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    references auth.users(id)
    on delete cascade,
  year integer not null,
  month integer not null,
  spending_limit numeric(14, 2) not null default 0,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint monthly_plans_year_check
    check (year between 2000 and 2100),

  constraint monthly_plans_month_check
    check (month between 1 and 12),

  constraint monthly_plans_spending_limit_check
    check (spending_limit >= 0),

  constraint monthly_plans_status_check
    check (status in ('draft', 'active')),

  constraint monthly_plans_user_period_key
    unique (user_id, year, month)
);

create table if not exists public.monthly_plan_goals (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null
    references public.monthly_plans(id)
    on delete cascade,
  category text not null,
  planned_amount numeric(14, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint monthly_plan_goals_category_check
    check (
      category in (
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
    ),

  constraint monthly_plan_goals_amount_check
    check (planned_amount > 0),

  constraint monthly_plan_goals_plan_category_key
    unique (plan_id, category)
);

create index if not exists monthly_plan_goals_plan_id_idx
  on public.monthly_plan_goals (plan_id);

create index if not exists monthly_plan_goals_category_idx
  on public.monthly_plan_goals (category);

comment on table public.monthly_plans is
  'Monthly spending plans owned by authenticated users. One plan per user, year and month.';

comment on column public.monthly_plans.spending_limit is
  'Global monthly spending limit defined by the user. Zero means not yet defined.';

comment on column public.monthly_plans.status is
  'Planning status: draft or active.';

comment on table public.monthly_plan_goals is
  'Category goals defined for a monthly plan. Missing category means no goal was defined.';

comment on column public.monthly_plan_goals.planned_amount is
  'Positive category goal amount. Categories without goals do not have a row.';

create or replace function public.set_monthly_plan_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists monthly_plans_set_updated_at
  on public.monthly_plans;

create trigger monthly_plans_set_updated_at
before update on public.monthly_plans
for each row
execute function public.set_monthly_plan_updated_at();

drop trigger if exists monthly_plan_goals_set_updated_at
  on public.monthly_plan_goals;

create trigger monthly_plan_goals_set_updated_at
before update on public.monthly_plan_goals
for each row
execute function public.set_monthly_plan_updated_at();

alter table public.monthly_plans
  enable row level security;

drop policy if exists monthly_plans_select_own
  on public.monthly_plans;

create policy monthly_plans_select_own
on public.monthly_plans
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists monthly_plans_insert_own
  on public.monthly_plans;

create policy monthly_plans_insert_own
on public.monthly_plans
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists monthly_plans_update_own
  on public.monthly_plans;

create policy monthly_plans_update_own
on public.monthly_plans
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists monthly_plans_delete_own
  on public.monthly_plans;

create policy monthly_plans_delete_own
on public.monthly_plans
for delete
to authenticated
using (auth.uid() = user_id);

alter table public.monthly_plan_goals
  enable row level security;

drop policy if exists monthly_plan_goals_select_own
  on public.monthly_plan_goals;

create policy monthly_plan_goals_select_own
on public.monthly_plan_goals
for select
to authenticated
using (
  exists (
    select 1
    from public.monthly_plans
    where monthly_plans.id = monthly_plan_goals.plan_id
      and monthly_plans.user_id = auth.uid()
  )
);

drop policy if exists monthly_plan_goals_insert_own
  on public.monthly_plan_goals;

create policy monthly_plan_goals_insert_own
on public.monthly_plan_goals
for insert
to authenticated
with check (
  exists (
    select 1
    from public.monthly_plans
    where monthly_plans.id = monthly_plan_goals.plan_id
      and monthly_plans.user_id = auth.uid()
  )
);

drop policy if exists monthly_plan_goals_update_own
  on public.monthly_plan_goals;

create policy monthly_plan_goals_update_own
on public.monthly_plan_goals
for update
to authenticated
using (
  exists (
    select 1
    from public.monthly_plans
    where monthly_plans.id = monthly_plan_goals.plan_id
      and monthly_plans.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.monthly_plans
    where monthly_plans.id = monthly_plan_goals.plan_id
      and monthly_plans.user_id = auth.uid()
  )
);

drop policy if exists monthly_plan_goals_delete_own
  on public.monthly_plan_goals;

create policy monthly_plan_goals_delete_own
on public.monthly_plan_goals
for delete
to authenticated
using (
  exists (
    select 1
    from public.monthly_plans
    where monthly_plans.id = monthly_plan_goals.plan_id
      and monthly_plans.user_id = auth.uid()
  )
);

revoke all on table public.monthly_plans
  from anon;

revoke all on table public.monthly_plan_goals
  from anon;

grant select, insert, update, delete
  on table public.monthly_plans
  to authenticated;

grant select, insert, update, delete
  on table public.monthly_plan_goals
  to authenticated;

commit;
