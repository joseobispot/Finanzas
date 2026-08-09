import Link from "next/link";
import { requireHousehold } from "@/lib/household";
import { createSavingsAccount } from "@/lib/actions/savings";
import { formatCurrency, formatShortDate } from "@/lib/format";

export default async function GoalsPage() {
  const { supabase, householdId } = await requireHousehold();

  const { data: goals } = await supabase
    .from("savings_accounts")
    .select("id, name, emoji, goal_amount, goal_date, savings_balances(balance)")
    .eq("household_id", householdId)
    .not("goal_amount", "is", null)
    .order("goal_date", { ascending: true, nullsFirst: false });

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-[23px] font-bold tracking-tight">Metas financieras</h1>
          <p className="text-ink-muted text-[13.8px] mt-0.5">Objetivos con monto y fecha</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
          {(goals ?? []).map((g) => {
            const balanceEntry = Array.isArray(g.savings_balances) ? g.savings_balances[0] : g.savings_balances;
            const balance = Number(balanceEntry?.balance ?? 0);
            const goalAmount = Number(g.goal_amount);
            const progress = goalAmount > 0 ? Math.min(1, balance / goalAmount) : 0;

            return (
              <Link
                key={g.id}
                href={`/savings/${g.id}`}
                className="bg-surface border border-border rounded-[18px] shadow-sm p-5 hover:border-forest transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-[42px] h-[42px] rounded-[13px] bg-forest-tint text-forest flex items-center justify-center text-xl flex-none">
                    {g.emoji ?? "🎯"}
                  </div>
                  <div>
                    <div className="text-[14.6px] font-bold">{g.name}</div>
                    {g.goal_date ? (
                      <div className="text-[11.8px] text-ink-muted">Meta: {formatShortDate(g.goal_date)}</div>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 mt-4">
                  <span className="text-[20px] font-extrabold tnum">{formatCurrency(balance)}</span>
                  <span className="text-[13px] text-ink-muted font-semibold tnum">
                    / {formatCurrency(goalAmount)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-2 mt-3 overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-forest"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[12.6px] font-bold text-forest">
                    {Math.round(progress * 100)}% completado
                  </span>
                  <span className="text-xs text-ink-muted">
                    Faltan {formatCurrency(Math.max(0, goalAmount - balance))}
                  </span>
                </div>
              </Link>
            );
          })}
          {(goals ?? []).length === 0 ? (
            <p className="text-[12.8px] text-ink-muted py-4">Sin metas todavía.</p>
          ) : null}
        </div>

        <form action={createSavingsAccount} className="bg-surface border border-border rounded-[18px] shadow-sm p-5 h-fit">
          <input type="hidden" name="kind" value="savings" />
          <h2 className="text-[15.5px] font-bold mb-3">Nueva meta</h2>
          <div className="flex flex-col gap-2.5">
            <div className="flex gap-2">
              <input
                name="emoji"
                placeholder="🎯"
                maxLength={4}
                className="w-14 border border-border rounded-[11px] px-2 py-2 text-center text-lg"
              />
              <input
                name="name"
                required
                placeholder="Nombre"
                className="flex-1 border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
              />
            </div>
            <input
              name="goalAmount"
              inputMode="decimal"
              required
              placeholder="Monto objetivo (RD$)"
              className="border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
            />
            <input
              type="date"
              name="goalDate"
              className="border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
            />
            <button type="submit" className="rounded-[11px] bg-forest text-white font-bold text-[13.3px] py-2.5">
              Crear meta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
