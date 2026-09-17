begin;

alter table public.expenses
  add column if not exists payment_method text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'expenses_payment_method_check'
      and conrelid = 'public.expenses'::regclass
  ) then
    alter table public.expenses
      add constraint expenses_payment_method_check
      check (
        payment_method is null
        or payment_method in (
          'pix',
          'debit',
          'credit',
          'cash',
          'boleto',
          'transfer',
          'other'
        )
      );
  end if;
end
$$;

comment on column public.expenses.payment_method is
  'Optional payment method: pix, debit, credit, cash, boleto, transfer or other. NULL means not informed.';

commit;
