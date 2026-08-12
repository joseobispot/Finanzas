import Link from "next/link";
import { formatCurrency, formatShortDate } from "@/lib/format";
import type { UpcomingPayment } from "@/lib/upcoming-payments";

function dueInfo(dueDateIso: string, today: Date) {
  const due = new Date(`${dueDateIso}T00:00:00`);
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((due.getTime() - todayMidnight.getTime()) / 86_400_000);

  if (diffDays < 0) {
    return {
      label: `Vencido hace ${-diffDays} día${-diffDays === 1 ? "" : "s"}`,
      tone: "overdue" as const,
    };
  }
  if (diffDays === 0) return { label: "Hoy", tone: "soon" as const };
  if (diffDays === 1) return { label: "Mañana", tone: "soon" as const };
  if (diffDays <= 5) return { label: `En ${diffDays} días`, tone: "soon" as const };
  return { label: formatShortDate(dueDateIso), tone: "normal" as const };
}

export function UpcomingPaymentsCard({ payments }: { payments: UpcomingPayment[] }) {
  const today = new Date();
  const visible = payments.slice(0, 6);

  return (
    <div className="bg-surface border border-border rounded-[18px] shadow-sm p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-[15.5px] font-bold">📅 Próximos pagos</h2>
        <Link href="/transactions?open=recurring#recurrentes" className="text-[12.8px] font-semibold text-forest">
          + Agregar pago recurrente
        </Link>
      </div>
      {visible.length === 0 ? (
        <p className="text-[12.8px] text-ink-muted py-2">
          Sin pagos recurrentes ni cuotas de préstamos pendientes. Agrega tus suscripciones, diezmos u
          otros pagos fijos como &quot;recurrentes&quot; para verlos aquí con su fecha.
        </p>
      ) : (
        <div className="flex flex-col">
          {visible.map((p, i) => {
            const { label, tone } = dueInfo(p.dueDate, today);
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 py-2.5 ${i > 0 ? "border-t border-border" : ""}`}
              >
                <div className="w-9 h-9 rounded-[11px] bg-surface-2 flex items-center justify-center text-base flex-none">
                  {p.emoji ?? "📦"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.4px] font-semibold truncate">{p.label}</div>
                  <div
                    className={`text-xs font-semibold mt-0.5 ${
                      tone === "overdue" ? "text-critical" : tone === "soon" ? "text-warning" : "text-ink-muted"
                    }`}
                  >
                    {label}
                  </div>
                </div>
                <div className="text-[13.6px] font-bold tnum">{formatCurrency(p.amount)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
