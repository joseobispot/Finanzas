import { requireHousehold } from "@/lib/household";
import { MonthComparisonChart, type ComparisonRow } from "@/components/reports/MonthComparisonChart";
import { MonthlyTrendChart, type TrendPoint } from "@/components/reports/MonthlyTrendChart";

function monthsAgoIso(n: number) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - n, 1).toISOString().slice(0, 10);
}

function shortMonthLabel(iso: string) {
  const label = new Intl.DateTimeFormat("es-DO", { month: "short" }).format(new Date(`${iso}T00:00:00`));
  return label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
}

export default async function ReportsPage() {
  const { supabase, householdId } = await requireHousehold();

  const currentMonth = monthsAgoIso(0);
  const previousMonth = monthsAgoIso(1);
  const trendStart = monthsAgoIso(5);

  const [{ data: categoryTotals }, { data: categories }, { data: trendRows }] = await Promise.all([
    supabase
      .from("monthly_category_totals")
      .select("category_id, month, total")
      .eq("household_id", householdId)
      .eq("type", "expense")
      .in("month", [currentMonth, previousMonth]),
    supabase.from("categories").select("id, name").eq("household_id", householdId),
    supabase
      .from("monthly_totals")
      .select("type, month, total")
      .eq("household_id", householdId)
      .eq("type", "expense")
      .gte("month", trendStart)
      .order("month"),
  ]);

  const nameById = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const byCategory = new Map<string, ComparisonRow>();
  for (const row of categoryTotals ?? []) {
    const name = nameById.get(row.category_id) ?? "Otros";
    const entry = byCategory.get(row.category_id) ?? { category: name, current: 0, previous: 0 };
    if (row.month === currentMonth) entry.current = Number(row.total);
    else entry.previous = Number(row.total);
    byCategory.set(row.category_id, entry);
  }
  const comparison = [...byCategory.values()]
    .sort((a, b) => Math.max(b.current, b.previous) - Math.max(a.current, a.previous))
    .slice(0, 8);

  const trendMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) trendMap.set(monthsAgoIso(i), 0);
  for (const row of trendRows ?? []) trendMap.set(row.month, Number(row.total));
  const trend: TrendPoint[] = [...trendMap.entries()].map(([month, total]) => ({
    label: shortMonthLabel(month),
    total,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[23px] font-bold tracking-tight">Reportes</h1>
        <p className="text-ink-muted text-[13.8px] mt-0.5">Comparación mes a mes por categoría</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-surface border border-border rounded-[18px] shadow-sm p-5">
          <h2 className="text-[15.5px] font-bold mb-3">Este mes vs. mes anterior</h2>
          {comparison.length === 0 ? (
            <p className="text-[12.8px] text-ink-muted py-6 text-center">
              Todavía no hay suficientes datos para comparar.
            </p>
          ) : (
            <MonthComparisonChart data={comparison} />
          )}
        </div>

        <div className="bg-surface border border-border rounded-[18px] shadow-sm p-5">
          <h2 className="text-[15.5px] font-bold mb-3">Gastos totales · últimos 6 meses</h2>
          <MonthlyTrendChart data={trend} />
        </div>
      </div>
    </div>
  );
}
