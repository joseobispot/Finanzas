import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireHousehold } from "@/lib/household";
import { createTransaction } from "@/lib/actions/transactions";
import { createRecurringRule } from "@/lib/actions/recurring";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { DeleteTransactionButton } from "@/components/transactions/DeleteTransactionButton";
import { EditTransactionButton } from "@/components/transactions/EditTransactionButton";
import { ToggleRecurringButton } from "@/components/transactions/ToggleRecurringButton";

function parseMonth(month?: string) {
  const now = new Date();
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    return new Date(y, m - 1, 1);
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function monthParam(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(d: Date) {
  const label = new Intl.DateTimeFormat("es-DO", { month: "long", year: "numeric" }).format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; type?: string }>;
}) {
  const { month: monthQuery, type: typeFilter } = await searchParams;
  const { supabase, householdId } = await requireHousehold();

  const monthDate = parseMonth(monthQuery);
  const monthStart = monthDate.toISOString().slice(0, 10);
  const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
  const prevMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1);

  await supabase.rpc("ensure_recurring_generated", {
    p_household_id: householdId,
    p_target_month: monthStart,
  });

  let query = supabase
    .from("transactions")
    .select("id, type, amount, description, occurred_on, category_id, categories(name, emoji)")
    .eq("household_id", householdId)
    .gte("occurred_on", monthStart)
    .lt("occurred_on", nextMonth.toISOString().slice(0, 10))
    .order("occurred_on", { ascending: false });

  if (typeFilter === "expense" || typeFilter === "income") {
    query = query.eq("type", typeFilter);
  }

  const { data: transactions } = await query;

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, emoji, type")
    .eq("household_id", householdId)
    .eq("is_active", true)
    .order("name");

  const { data: rules } = await supabase
    .from("recurring_rules")
    .select("id, type, amount, description, day_of_month, active, categories(name, emoji)")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  const total = (transactions ?? []).reduce(
    (sum, t) => sum + (t.type === "income" ? t.amount : -t.amount),
    0,
  );

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-[23px] font-bold tracking-tight">Transacciones</h1>
          <p className="text-ink-muted text-[13.8px] mt-0.5">
            Neto del mes:{" "}
            <span className={`font-bold tnum ${total >= 0 ? "text-forest" : "text-ink"}`}>
              {formatCurrency(total)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/transactions?month=${monthParam(prevMonth)}${typeFilter ? `&type=${typeFilter}` : ""}`}
            className="p-2 rounded-full bg-surface border border-border"
          >
            <ChevronLeft size={16} />
          </Link>
          <span className="text-[13.5px] font-bold w-40 text-center">{monthLabel(monthDate)}</span>
          <Link
            href={`/transactions?month=${monthParam(nextMonth)}${typeFilter ? `&type=${typeFilter}` : ""}`}
            className="p-2 rounded-full bg-surface border border-border"
          >
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { key: undefined, label: "Todos" },
          { key: "expense", label: "Gastos" },
          { key: "income", label: "Ingresos" },
        ].map((f) => (
          <Link
            key={f.label}
            href={`/transactions?month=${monthParam(monthDate)}${f.key ? `&type=${f.key}` : ""}`}
            className={`text-[12.6px] font-bold px-3 py-1.5 rounded-full border ${
              typeFilter === f.key || (!typeFilter && !f.key)
                ? "bg-forest text-white border-forest"
                : "bg-surface text-ink-muted border-border"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="bg-surface border border-border rounded-[18px] shadow-sm p-5">
          {(transactions ?? []).length === 0 ? (
            <p className="text-[12.8px] text-ink-muted py-6 text-center">
              Sin movimientos en este mes.
            </p>
          ) : (
            (transactions ?? []).map((t, i) => {
              const cat = Array.isArray(t.categories) ? t.categories[0] : t.categories;
              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 py-2.5 ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <div className="w-9 h-9 rounded-[11px] bg-surface-2 flex items-center justify-center text-base flex-none">
                    {cat?.emoji ?? "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.4px] font-semibold truncate">
                      {t.description || cat?.name}
                    </div>
                    <div className="text-xs text-ink-muted mt-0.5">
                      {cat?.name} · {formatShortDate(t.occurred_on)}
                    </div>
                  </div>
                  <div className={`text-[13.6px] font-bold tnum ${t.type === "income" ? "text-forest" : ""}`}>
                    {t.type === "income" ? "+" : "−"}
                    {formatCurrency(t.amount)}
                  </div>
                  <EditTransactionButton
                    transaction={{
                      id: t.id,
                      type: t.type,
                      amount: t.amount,
                      categoryId: t.category_id,
                      occurredOn: t.occurred_on,
                      description: t.description,
                    }}
                    categories={categories ?? []}
                  />
                  <DeleteTransactionButton id={t.id} />
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-col gap-4">
          <form action={createTransaction} className="bg-surface border border-border rounded-[18px] shadow-sm p-5">
            <h2 className="text-[15.5px] font-bold mb-3">Registrar movimiento</h2>
            <div className="flex flex-col gap-2.5">
              <select name="type" className="border border-border rounded-[11px] px-3 py-2 text-[13.5px] bg-surface">
                <option value="expense">Gasto</option>
                <option value="income">Ingreso</option>
              </select>
              <input
                name="amount"
                inputMode="decimal"
                required
                placeholder="Monto (RD$)"
                className="border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
              />
              <select
                name="categoryId"
                required
                className="border border-border rounded-[11px] px-3 py-2 text-[13.5px] bg-surface"
              >
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                name="occurredOn"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
              />
              <input
                name="description"
                placeholder="Descripción (opcional)"
                className="border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
              />
              <button type="submit" className="rounded-[11px] bg-forest text-white font-bold text-[13.3px] py-2.5">
                Guardar
              </button>
            </div>
          </form>

          <div className="bg-surface border border-border rounded-[18px] shadow-sm p-5">
            <h2 className="text-[15.5px] font-bold mb-3">Recurrentes</h2>
            <div className="flex flex-col gap-1 mb-4">
              {(rules ?? []).map((r) => {
                const cat = Array.isArray(r.categories) ? r.categories[0] : r.categories;
                return (
                  <div key={r.id} className="flex items-center gap-2.5 py-1.5">
                    <span className="text-base">{cat?.emoji ?? "📦"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.8px] font-semibold truncate">
                        {r.description || cat?.name}
                      </div>
                      <div className="text-[11px] text-ink-muted">
                        Día {r.day_of_month} · {formatCurrency(r.amount)}
                      </div>
                    </div>
                    <ToggleRecurringButton id={r.id} active={r.active} />
                  </div>
                );
              })}
              {(rules ?? []).length === 0 ? (
                <p className="text-[12.3px] text-ink-muted">Sin reglas recurrentes todavía.</p>
              ) : null}
            </div>

            <details>
              <summary className="text-[12.8px] font-bold text-forest cursor-pointer">
                + Nueva regla recurrente
              </summary>
              <form action={createRecurringRule} className="flex flex-col gap-2.5 mt-3">
                <select name="type" className="border border-border rounded-[11px] px-3 py-2 text-[13.5px] bg-surface">
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                </select>
                <input
                  name="amount"
                  inputMode="decimal"
                  required
                  placeholder="Monto (RD$)"
                  className="border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
                />
                <select
                  name="categoryId"
                  required
                  className="border border-border rounded-[11px] px-3 py-2 text-[13.5px] bg-surface"
                >
                  {(categories ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.name}
                    </option>
                  ))}
                </select>
                <input
                  name="description"
                  placeholder="Descripción (ej. Salario)"
                  className="border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
                />
                <div className="flex gap-2.5">
                  <input
                    type="number"
                    name="dayOfMonth"
                    min={1}
                    max={31}
                    defaultValue={1}
                    className="w-24 border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
                  />
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="flex-1 border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
                  />
                </div>
                <button type="submit" className="rounded-[11px] bg-forest text-white font-bold text-[13.3px] py-2.5">
                  Crear regla
                </button>
              </form>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
