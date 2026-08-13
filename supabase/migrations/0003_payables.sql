-- Fiado / cuentas por pagar informales (ej. tienda de un familiar):
-- saldo que sube con cada compra a crédito y baja con cada pago general,
-- sin interés ni cuotas. No toca transactions: comprar a crédito no es un
-- gasto en efectivo todavía, igual que un préstamo no lo es hasta pagarlo.

create table payables (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  emoji text,
  created_at timestamptz not null default now()
);

create table payable_movements (
  id uuid primary key default gen_random_uuid(),
  payable_id uuid not null references payables(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  type text not null check (type in ('charge', 'payment')),
  amount numeric(12, 2) not null check (amount > 0),
  occurred_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create view payable_balances with (security_invoker = true) as
select
  payable_id,
  household_id,
  sum(case when type = 'charge' then amount else -amount end) as balance
from payable_movements
group by payable_id, household_id;

alter table payables enable row level security;
alter table payable_movements enable row level security;

create policy "hh select" on payables for select using (is_household_member(household_id));
create policy "hh insert" on payables for insert with check (is_household_member(household_id));
create policy "hh update" on payables for update using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy "hh delete" on payables for delete using (is_household_member(household_id));

create policy "hh select" on payable_movements for select using (is_household_member(household_id));
create policy "hh insert" on payable_movements for insert with check (is_household_member(household_id));
create policy "hh update" on payable_movements for update using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy "hh delete" on payable_movements for delete using (is_household_member(household_id));
