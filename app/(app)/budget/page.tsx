import { requireHousehold } from "@/lib/household";
import { setBudget } from "@/lib/actions/budgets";
import { formatCurrency } from "@/lib/format";

export default async function BudgetPage() {
  const { supabase, householdId } = await requireHousehold();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [{ data: categories }, { data: budgets }, { data: spentRows }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, emoji")
      .eq("household_id", householdId)
      .eq("type", "expense")
      .eq("is_active", true)
      .order("name"),
    supabase.from("budgets").select("category_id, monthly_limit").eq("household_id", householdId),
    supabase
      .from("monthly_category_totals")
      .select("category_id, total")
      .eq("household_id", householdId)
      .eq("type", "expense")
      .eq("month", monthStart),
  ]);

  const limitByCategory = new Map((budgets ?? []).map((b) => [b.category_id, Number(b.monthly_limit)]));
  const spentByCategory = new Map((spentRows ?? []).map((s) => [s.category_id, Number(s.total)]));

  const totalSpent = [...spentByCategory.values()].reduce((s, v) => s + v, 0);
  const totalLimit = [...limitByCategory.values()].reduce((s, v) => s + v, 0);

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-[23px] font-bold tracking-tight">Presupuesto</h1>
          <p className="text-ink-muted text-[13.8px] mt-0.5">Límite mensual por categoría</p>
        </div>
        {totalLimit > 0 ? (
          <div className="text-[12.5px] text-ink-muted bg-surface border border-border px-3 py-1.5 rounded-full tnum">
            {formatCurrency(totalSpent)} gastados de {formatCurrency(totalLimit)}
          </div>
        ) : null}
      </div>

      <div className="bg-surface border border-border rounded-[18px] shadow-sm px-5 md:px-6 divide-y divide-border">
        {(categories ?? []).map((c) => {
          const limit = limitByCategory.get(c.id);
          const spent = spentByCategory.get(c.id) ?? 0;
          const pct = limit ? Math.round((spent / limit) * 100) : null;
          const state = pct === null ? "none" : pct > 100 ? "crit" : pct >= 90 ? "warn" : "ok";

          return (
            <div key={c.id} className="py-4">
              <div className="flex items-center gap-3">
                <span className="text-[13.8px] font-semibold flex-1 flex items-center gap-2">
                  <span>{c.emoji}</span> {c.name}
                </span>

                {limit ? (
                  <span className="text-[13px] font-bold tnum">
                    {formatCurrency(spent)} <span className="text-ink-muted font-semibold">/ {formatCurrency(limit)}</span>
                  </span>
                ) : null}

                {pct !== null ? (
                  <span
                    className={`text-[11.5px] font-bold px-2 py-[3px] rounded-full ${
                      state === "crit"
                        ? "bg-critical-tint text-critical"
                        : state === "warn"
                          ? "bg-warning-tint text-warning"
                          : "bg-surface-2 text-ink-muted"
                    }`}
                  >
                    {pct}%
                  </span>
                ) : null}

                <form action={setBudget} className="flex items-center gap-1.5">
                  <input type="hidden" name="categoryId" value={c.id} />
                  <input
                    name="monthlyLimit"
                    inputMode="decimal"
                    defaultValue={limit ?? ""}
                    placeholder="Límite"
                    className="w-24 border border-border rounded-[9px] px-2 py-1 text-[12.5px]"
                  />
                  <button type="submit" className="text-[11.5px] font-bold text-forest px-2 py-1">
                    Guardar
                  </button>
                </form>
              </div>

              {limit ? (
                <>
                  <div className="h-2 rounded-full bg-surface-2 mt-2.5 overflow-hidden">
                    <span
                      className={`block h-full rounded-full ${
                        state === "crit" ? "bg-critical" : state === "warn" ? "bg-warning" : "bg-forest"
                      }`}
                      style={{ width: `${Math.min(100, pct ?? 0)}%` }}
                    />
                  </div>
                  {state === "warn" ? (
                    <div className="text-[12px] font-semibold text-warning mt-1.5">⚠️ Cerca del límite</div>
                  ) : null}
                  {state === "crit" ? (
                    <div className="text-[12px] font-semibold text-critical mt-1.5">
                      🚨 Presupuesto sobrepasado en {formatCurrency(spent - limit)}
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          );
        })}
        {(categories ?? []).length === 0 ? (
          <p className="text-[12.8px] text-ink-muted py-6 text-center">Sin categorías de gasto todavía.</p>
        ) : null}
      </div>
    </div>
  );
}
