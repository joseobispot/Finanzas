import Link from "next/link";
import { ArrowUp, ArrowDown, PiggyBank, Target } from "lucide-react";
import { requireHousehold } from "@/lib/household";
import { getDashboardData } from "@/lib/dashboard-data";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { DeltaPill } from "@/components/dashboard/DeltaPill";

const FIRST_NAME_BY_USER_ID: Record<string, string> = {
  "222e6226-c3a4-4377-802f-ae23bcf0593a": "José",
  "2e06d696-e4a0-4d02-b6ea-3ad8a24dfeae": "Masiel",
};

function todayLabel() {
  const label = new Intl.DateTimeFormat("es-DO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default async function DashboardPage() {
  const { supabase, user, householdId } = await requireHousehold();
  const firstName = FIRST_NAME_BY_USER_ID[user.id] ?? "";
  const data = await getDashboardData(supabase, householdId);

  const savingsRate = data.income.current > 0 ? (data.savings.current / data.income.current) * 100 : 0;

  const topGoal = [...data.goals].sort((a, b) => b.progress - a.progress)[0];
  const expenseDelta =
    data.expense.previous > 0 ? ((data.expense.current - data.expense.previous) / data.expense.previous) * 100 : null;

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-2.5 mb-6">
        <div>
          <h1 className="text-[23px] font-bold tracking-tight">
            Hola{firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p className="text-ink-muted text-[13.8px] mt-0.5">Este es el estado de tus finanzas</p>
        </div>
        <div className="text-[12.5px] text-ink-muted bg-surface border border-border px-3 py-1.5 rounded-full">
          {todayLabel()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_1fr] gap-4 mb-5">
        <div className="relative overflow-hidden rounded-[18px] p-6 md:p-7 text-navy-ink shadow-sm bg-gradient-to-br from-navy to-[#0b2531]">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[radial-gradient(circle,rgba(61,190,132,0.20),transparent_70%)]" />
          <div className="relative">
            <div className="text-[11px] font-bold uppercase tracking-wide text-navy-muted">
              💰 Balance disponible
            </div>
            <div className="text-[38px] md:text-[40px] font-extrabold tracking-tight mt-1.5 tnum">
              {formatCurrency(data.balance)}
            </div>
            <div className="flex items-center gap-4 mt-3">
              {data.balanceSpark.length > 3 ? (
                <DeltaPill current={data.balanceSpark.at(-1)!} previous={data.balanceSpark[0]} favorableWhenUp />
              ) : null}
              <span className="text-[12.3px] text-navy-muted">Ingresos − gastos acumulados</span>
            </div>
            <div className="mt-4">
              <Sparkline data={data.balanceSpark} fillId="hero-spark" strokeColor="#4ecb92" />
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-[18px] shadow-sm p-5 flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15.5px] font-bold">🎯 Metas en curso</h2>
            <Link href="/goals" className="text-[12.8px] font-semibold text-forest">
              Ver todas
            </Link>
          </div>
          {data.goals.length === 0 ? (
            <p className="text-[12.8px] text-ink-muted">
              Aún no tienes metas.{" "}
              <Link href="/goals" className="font-semibold text-forest">
                Crea la primera
              </Link>
              .
            </p>
          ) : (
            data.goals.map((g) => (
              <div key={g.id} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[10px] bg-surface-2 flex items-center justify-center text-sm flex-none">
                  {g.emoji ?? "🎯"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.8px] font-semibold truncate">{g.name}</div>
                  <div className="h-[5px] rounded-full bg-surface-2 mt-1 overflow-hidden">
                    <span
                      className="block h-full rounded-full bg-forest"
                      style={{ width: `${Math.round(g.progress * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs font-bold text-ink-muted">{Math.round(g.progress * 100)}%</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        <div className="bg-surface border border-border rounded-[18px] shadow-sm p-4.5">
          <div className="flex items-center justify-between">
            <div className="w-[30px] h-[30px] rounded-[9px] bg-forest-tint text-forest flex items-center justify-center">
              <ArrowUp size={15} strokeWidth={2} />
            </div>
            <DeltaPill current={data.income.current} previous={data.income.previous} favorableWhenUp compact />
          </div>
          <div className="text-[22px] font-extrabold tracking-tight mt-3 tnum">
            {formatCurrency(data.income.current)}
          </div>
          <div className="text-[12.3px] text-ink-muted mt-0.5">Ingresos del mes</div>
        </div>

        <div className="bg-surface border border-border rounded-[18px] shadow-sm p-4.5">
          <div className="flex items-center justify-between">
            <div className="w-[30px] h-[30px] rounded-[9px] bg-navy text-navy-ink flex items-center justify-center">
              <ArrowDown size={15} strokeWidth={2} />
            </div>
            <DeltaPill current={data.expense.current} previous={data.expense.previous} favorableWhenUp={false} compact />
          </div>
          <div className="text-[22px] font-extrabold tracking-tight mt-3 tnum">
            {formatCurrency(data.expense.current)}
          </div>
          <div className="text-[12.3px] text-ink-muted mt-0.5">Gastos del mes</div>
        </div>

        <div className="bg-surface border border-border rounded-[18px] shadow-sm p-4.5">
          <div className="flex items-center justify-between">
            <div className="w-[30px] h-[30px] rounded-[9px] bg-forest-tint text-forest flex items-center justify-center">
              <PiggyBank size={15} strokeWidth={2} />
            </div>
            <DeltaPill current={data.savings.current} previous={data.savings.previous} favorableWhenUp compact />
          </div>
          <div className="text-[22px] font-extrabold tracking-tight mt-3 tnum">
            {formatCurrency(data.savings.current)}
          </div>
          <div className="text-[12.3px] text-ink-muted mt-0.5">
            Ahorrado · {savingsRate.toFixed(1)}% de ingresos
          </div>
        </div>

        <div className="bg-surface border border-border rounded-[18px] shadow-sm p-4.5">
          <div className="flex items-center justify-between">
            <div className="w-[30px] h-[30px] rounded-[9px] bg-warning-tint text-warning flex items-center justify-center">
              <Target size={15} strokeWidth={2} />
            </div>
            <span className="text-[11px] font-bold px-2 py-[3px] rounded-full bg-surface-2 text-ink-muted">
              {data.goals.length} activas
            </span>
          </div>
          <div className="text-[22px] font-extrabold tracking-tight mt-3 tnum">
            {Math.round(data.goalsAvgProgress * 100)}%
          </div>
          <div className="text-[12.3px] text-ink-muted mt-0.5">Progreso promedio de metas</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4">
        <div className="bg-surface border border-border rounded-[18px] shadow-sm p-5">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[15.5px] font-bold">Gastos por categoría · este mes</h2>
            <Link href="/budget" className="text-[12.8px] font-semibold text-forest">
              Ver presupuesto
            </Link>
          </div>
          {data.categories.length === 0 ? (
            <p className="text-[12.8px] text-ink-muted py-4">
              Todavía no hay gastos registrados este mes.
            </p>
          ) : (
            data.categories.map((c) => (
              <div key={c.categoryId} className="flex items-center gap-3 py-2">
                <div className="w-9 h-9 rounded-[11px] bg-surface-2 flex items-center justify-center text-base flex-none">
                  {c.emoji ?? "📦"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.4px] font-semibold">{c.name}</div>
                  <div className="h-[5px] rounded-full bg-surface-2 mt-1.5 overflow-hidden">
                    <span
                      className="block h-full rounded-full bg-forest"
                      style={{ width: `${Math.max(4, Math.round(c.share * 100))}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[13.4px] font-bold tnum">{formatCurrency(c.total)}</div>
                  <div className="text-[11px] font-semibold text-ink-muted">
                    {Math.round(c.share * 100)}%
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-[18px] shadow-sm p-5">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-[15.5px] font-bold">Últimos movimientos</h2>
              <Link href="/transactions" className="text-[12.8px] font-semibold text-forest">
                Ver todas
              </Link>
            </div>
            {data.recent.length === 0 ? (
              <p className="text-[12.8px] text-ink-muted py-4">
                Aún no has registrado ningún movimiento. Usa el botón &quot;Nuevo movimiento&quot;.
              </p>
            ) : (
              data.recent.map((t, i) => (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 py-2.5 ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <div className="w-9 h-9 rounded-[11px] bg-surface-2 flex items-center justify-center text-base flex-none">
                    {t.categoryEmoji ?? "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.4px] font-semibold truncate">
                      {t.description || t.categoryName}
                    </div>
                    <div className="text-xs text-ink-muted mt-0.5">
                      {t.categoryName} · {formatShortDate(t.occurredOn)}
                    </div>
                  </div>
                  <div className={`text-[13.6px] font-bold tnum ${t.type === "income" ? "text-forest" : ""}`}>
                    {t.type === "income" ? "+" : "−"}
                    {formatCurrency(t.amount)}
                  </div>
                </div>
              ))
            )}
          </div>

          {(expenseDelta !== null && expenseDelta < 0) || topGoal ? (
            <div className="bg-surface border border-border rounded-[18px] shadow-sm p-4">
              {expenseDelta !== null && expenseDelta < 0 ? (
                <div className="flex gap-2.5 items-start bg-forest-tint rounded-[11px] px-4 py-3.5">
                  <span className="text-[19px]">🎉</span>
                  <div>
                    <div className="text-[13.4px] font-bold text-forest-strong">¡Excelente!</div>
                    <div className="text-[12.6px] text-ink-muted mt-0.5">
                      Gastaste {Math.abs(expenseDelta).toFixed(0)}% menos que el mes pasado.
                    </div>
                  </div>
                </div>
              ) : null}
              {topGoal && topGoal.progress >= 0.4 ? (
                <div className="flex gap-2.5 items-start bg-forest-tint rounded-[11px] px-4 py-3.5 mt-2.5">
                  <span className="text-[19px]">🔥</span>
                  <div>
                    <div className="text-[13.4px] font-bold text-forest-strong">Vas muy bien</div>
                    <div className="text-[12.6px] text-ink-muted mt-0.5">
                      Ya llevas el {Math.round(topGoal.progress * 100)}% de tu meta &quot;{topGoal.name}&quot;.
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
