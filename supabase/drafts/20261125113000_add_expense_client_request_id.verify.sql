-- =========================================================
-- VERIFY: expense client request id migration
-- SOMENTE LEITURA
-- =========================================================

-- 1. Column definition
select
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'expenses'
  and column_name = 'client_request_id';

-- 2. Expected unique partial index
select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'expenses'
  and indexname =
    'expenses_user_client_request_id_uidx';

-- 3. Preservation of existing rows
select
  count(*) as total_rows,
  count(*) filter (
    where client_request_id is null
  ) as rows_without_client_request_id,
  count(*) filter (
    where client_request_id is not null
  ) as rows_with_client_request_id
from public.expenses;

-- 4. No duplicate non-null operation identifiers
select
  user_id,
  client_request_id,
  count(*) as occurrence_count
from public.expenses
where client_request_id is not null
group by
  user_id,
  client_request_id
having count(*) > 1;

-- 5. RLS remains enabled
select
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n
  on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'expenses';
