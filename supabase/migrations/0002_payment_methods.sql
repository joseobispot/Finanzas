-- Métodos de pago (efectivo, débito, tarjetas de crédito con corte/pago)

create table payment_methods (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('cash', 'debit', 'credit')),
  statement_day int check (statement_day between 1 and 31),
  payment_day int check (payment_day between 1 and 31),
  created_at timestamptz not null default now()
);

alter table transactions
  add column payment_method_id uuid references payment_methods(id) on delete set null;

alter table payment_methods enable row level security;

create policy "hh select" on payment_methods for select using (is_household_member(household_id));
create policy "hh insert" on payment_methods for insert with check (is_household_member(household_id));
create policy "hh update" on payment_methods for update using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy "hh delete" on payment_methods for delete using (is_household_member(household_id));
