-- Esquema inicial: app de finanzas del hogar (José + esposa)
-- Un solo hogar comparte todos los datos financieros. Ver plan en
-- /Users/usuario/.claude/plans/reflective-plotting-plum.md para el razonamiento completo.

create extension if not exists pgcrypto;

-- ============================================================
-- Households
-- ============================================================

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Hogar',
  created_at timestamptz not null default now()
);

create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (user_id)
);

create or replace function public.is_household_member(hh uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from household_members hm
    where hm.household_id = hh and hm.user_id = auth.uid()
  );
$$;

-- ============================================================
-- Categorías
-- ============================================================

create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  type text not null check (type in ('expense', 'income')),
  emoji text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (household_id, name, type)
);

create or replace function public.seed_default_categories()
returns trigger language plpgsql as $$
begin
  insert into categories (household_id, name, type, emoji) values
    (new.id, 'Comida/Supermercado', 'expense', '🍔'),
    (new.id, 'Transporte', 'expense', '⛽'),
    (new.id, 'Gastos hormiga', 'expense', '☕'),
    (new.id, 'Servicios', 'expense', '💡'),
    (new.id, 'Salud', 'expense', '❤️'),
    (new.id, 'Entretenimiento', 'expense', '🎬'),
    (new.id, 'Ropa', 'expense', '🛍️'),
    (new.id, 'Educación', 'expense', '🎓'),
    (new.id, 'Hogar/Mantenimiento', 'expense', '🏠'),
    (new.id, 'Iglesia', 'expense', '🙏'),
    (new.id, 'Suscripciones', 'expense', '📱'),
    (new.id, 'Otros gastos', 'expense', '📦'),
    (new.id, 'Salario', 'income', '💼'),
    (new.id, 'Ingresos extra', 'income', '📈'),
    (new.id, 'Regalos/Ayudas', 'income', '🎁'),
    (new.id, 'Otros ingresos', 'income', '💰');
  return new;
end;
$$;

create trigger trg_seed_categories
after insert on households
for each row execute function public.seed_default_categories();

-- ============================================================
-- Reglas recurrentes y transacciones
-- ============================================================

create table recurring_rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid not null references categories(id),
  type text not null check (type in ('expense', 'income')),
  amount numeric(12, 2) not null check (amount > 0),
  description text,
  day_of_month int not null default 1 check (day_of_month between 1 and 31),
  start_date date not null,
  end_date date,
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid not null references categories(id),
  user_id uuid not null references auth.users(id),
  type text not null check (type in ('expense', 'income')),
  amount numeric(12, 2) not null check (amount > 0),
  description text,
  occurred_on date not null default current_date,
  recurring_rule_id uuid references recurring_rules(id),
  period_month date,
  created_at timestamptz not null default now()
);

create index idx_transactions_household_date on transactions (household_id, occurred_on);
create index idx_transactions_household_category on transactions (household_id, category_id);

create unique index uniq_recurring_period
  on transactions (recurring_rule_id, period_month)
  where recurring_rule_id is not null;

-- Genera de forma perezosa las transacciones de reglas recurrentes que falten
-- hasta target_month (acotado a 24 meses de backfill). Idempotente vía
-- on conflict: se puede llamar en cada carga del dashboard sin duplicar nada.
create or replace function public.ensure_recurring_generated(
  p_household_id uuid,
  p_target_month date
) returns void
language sql
security definer
set search_path = public
as $$
  insert into transactions (
    household_id, category_id, user_id, type, amount, description,
    occurred_on, recurring_rule_id, period_month
  )
  select
    r.household_id,
    r.category_id,
    (select user_id from household_members where household_id = r.household_id limit 1),
    r.type,
    r.amount,
    r.description,
    least(
      period + (r.day_of_month - 1) * interval '1 day',
      (period + interval '1 month' - interval '1 day')
    )::date,
    r.id,
    period::date
  from recurring_rules r
  cross join lateral generate_series(
    greatest(date_trunc('month', r.start_date), date_trunc('month', p_target_month) - interval '24 months'),
    date_trunc('month', p_target_month),
    interval '1 month'
  ) as period
  where r.household_id = p_household_id
    and r.active
    and (r.end_date is null or period <= date_trunc('month', r.end_date))
  on conflict (recurring_rule_id, period_month) do nothing;
$$;

-- ============================================================
-- Presupuestos
-- ============================================================

create table budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  monthly_limit numeric(12, 2) not null check (monthly_limit > 0),
  created_at timestamptz not null default now(),
  unique (household_id, category_id)
);

-- ============================================================
-- Préstamos ("Deudas" en la UI)
-- ============================================================

create table loans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  principal numeric(12, 2) not null check (principal > 0),
  annual_interest_rate numeric(6, 4) not null check (annual_interest_rate >= 0),
  term_months int not null check (term_months > 0),
  start_date date not null,
  created_at timestamptz not null default now()
);

create table loan_payments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  paid_on date not null default current_date,
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Ahorros e inversiones (incluye metas)
-- ============================================================

create table savings_accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  kind text not null default 'savings' check (kind in ('savings', 'investment')),
  emoji text,
  goal_amount numeric(12, 2),
  goal_date date,
  created_at timestamptz not null default now()
);

create table savings_movements (
  id uuid primary key default gen_random_uuid(),
  savings_account_id uuid not null references savings_accounts(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  type text not null check (type in ('deposit', 'withdrawal')),
  amount numeric(12, 2) not null check (amount > 0),
  occurred_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Vistas de agregados (security_invoker: respetan RLS de las tablas base)
-- ============================================================

create view savings_balances with (security_invoker = true) as
select
  savings_account_id,
  household_id,
  sum(case when type = 'deposit' then amount else -amount end) as balance
from savings_movements
group by savings_account_id, household_id;

create view monthly_totals with (security_invoker = true) as
select
  household_id,
  type,
  date_trunc('month', occurred_on)::date as month,
  sum(amount) as total
from transactions
group by household_id, type, date_trunc('month', occurred_on);

create view monthly_category_totals with (security_invoker = true) as
select
  household_id,
  type,
  category_id,
  date_trunc('month', occurred_on)::date as month,
  sum(amount) as total
from transactions
group by household_id, type, category_id, date_trunc('month', occurred_on);

-- Balance disponible acumulado (todo el historial): ingresos - gastos.
-- No hay tabla de "cuentas bancarias" en este esquema (fuera de alcance del plan),
-- así que el balance del hogar es simplemente el neto acumulado de transacciones.
create view household_balance with (security_invoker = true) as
select
  household_id,
  coalesce(sum(case when type = 'income' then amount else -amount end), 0) as balance
from transactions
group by household_id;

-- Totales semanales, usados para las mini-gráficas de tendencia del dashboard.
create view weekly_totals with (security_invoker = true) as
select
  household_id,
  type,
  date_trunc('week', occurred_on)::date as week,
  sum(amount) as total
from transactions
group by household_id, type, date_trunc('week', occurred_on);

-- ============================================================
-- RLS: mismo patrón (select/insert/update/delete por is_household_member) en todas las tablas de datos
-- ============================================================

alter table households enable row level security;
alter table household_members enable row level security;
alter table categories enable row level security;
alter table recurring_rules enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table loans enable row level security;
alter table loan_payments enable row level security;
alter table savings_accounts enable row level security;
alter table savings_movements enable row level security;

create policy "hh select" on households for select using (is_household_member(id));

create policy "hh select" on household_members for select using (user_id = auth.uid() or is_household_member(household_id));

create policy "hh select" on categories for select using (is_household_member(household_id));
create policy "hh insert" on categories for insert with check (is_household_member(household_id));
create policy "hh update" on categories for update using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy "hh delete" on categories for delete using (is_household_member(household_id));

create policy "hh select" on recurring_rules for select using (is_household_member(household_id));
create policy "hh insert" on recurring_rules for insert with check (is_household_member(household_id));
create policy "hh update" on recurring_rules for update using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy "hh delete" on recurring_rules for delete using (is_household_member(household_id));

create policy "hh select" on transactions for select using (is_household_member(household_id));
create policy "hh insert" on transactions for insert with check (is_household_member(household_id));
create policy "hh update" on transactions for update using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy "hh delete" on transactions for delete using (is_household_member(household_id));

create policy "hh select" on budgets for select using (is_household_member(household_id));
create policy "hh insert" on budgets for insert with check (is_household_member(household_id));
create policy "hh update" on budgets for update using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy "hh delete" on budgets for delete using (is_household_member(household_id));

create policy "hh select" on loans for select using (is_household_member(household_id));
create policy "hh insert" on loans for insert with check (is_household_member(household_id));
create policy "hh update" on loans for update using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy "hh delete" on loans for delete using (is_household_member(household_id));

create policy "hh select" on loan_payments for select using (is_household_member(household_id));
create policy "hh insert" on loan_payments for insert with check (is_household_member(household_id));
create policy "hh update" on loan_payments for update using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy "hh delete" on loan_payments for delete using (is_household_member(household_id));

create policy "hh select" on savings_accounts for select using (is_household_member(household_id));
create policy "hh insert" on savings_accounts for insert with check (is_household_member(household_id));
create policy "hh update" on savings_accounts for update using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy "hh delete" on savings_accounts for delete using (is_household_member(household_id));

create policy "hh select" on savings_movements for select using (is_household_member(household_id));
create policy "hh insert" on savings_movements for insert with check (is_household_member(household_id));
create policy "hh update" on savings_movements for update using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy "hh delete" on savings_movements for delete using (is_household_member(household_id));
