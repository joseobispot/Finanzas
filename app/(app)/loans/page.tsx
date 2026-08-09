import Link from "next/link";
import { requireHousehold } from "@/lib/household";
import { createLoan } from "@/lib/actions/loans";
import { computeAmortizationSchedule, totalScheduledPayments } from "@/lib/amortization";
import { formatCurrency } from "@/lib/format";

export default async function LoansPage() {
  const { supabase, householdId } = await requireHousehold();

  const { data: loans } = await supabase
    .from("loans")
    .select("id, name, principal, annual_interest_rate, term_months, start_date")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  const { data: payments } = await supabase
    .from("loan_payments")
    .select("loan_id, amount")
    .eq("household_id", householdId);

  const paidByLoan = new Map<string, number>();
  for (const p of payments ?? []) {
    paidByLoan.set(p.loan_id, (paidByLoan.get(p.loan_id) ?? 0) + Number(p.amount));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[23px] font-bold tracking-tight">Deudas</h1>
        <p className="text-ink-muted text-[13.8px] mt-0.5">Préstamos con amortización automática</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
          {(loans ?? []).map((loan) => {
            const schedule = computeAmortizationSchedule(
              Number(loan.principal),
              Number(loan.annual_interest_rate),
              loan.term_months,
              new Date(`${loan.start_date}T00:00:00`),
            );
            const totalScheduled = totalScheduledPayments(schedule);
            const paid = paidByLoan.get(loan.id) ?? 0;
            const remaining = Math.max(0, totalScheduled - paid);
            const progress = totalScheduled > 0 ? Math.min(1, paid / totalScheduled) : 0;

            return (
              <Link
                key={loan.id}
                href={`/loans/${loan.id}`}
                className="bg-surface border border-border rounded-[18px] shadow-sm p-5 hover:border-forest transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-[11px] bg-navy text-navy-ink flex items-center justify-center text-base flex-none">
                    💳
                  </div>
                  <div>
                    <div className="text-[14.6px] font-bold">{loan.name}</div>
                    <div className="text-[11.8px] text-ink-muted">
                      {loan.annual_interest_rate}% anual · {loan.term_months} meses
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 mt-4">
                  <span className="text-[19px] font-extrabold tnum">{formatCurrency(paid)}</span>
                  <span className="text-[12.5px] text-ink-muted font-semibold tnum">
                    / {formatCurrency(totalScheduled)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-2 mt-2.5 overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-forest"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[12.3px] font-bold text-forest">
                    {Math.round(progress * 100)}% pagado
                  </span>
                  <span className="text-xs text-ink-muted">Faltan {formatCurrency(remaining)}</span>
                </div>
              </Link>
            );
          })}
          {(loans ?? []).length === 0 ? (
            <p className="text-[12.8px] text-ink-muted py-4">Sin préstamos registrados todavía.</p>
          ) : null}
        </div>

        <form action={createLoan} className="bg-surface border border-border rounded-[18px] shadow-sm p-5 h-fit">
          <h2 className="text-[15.5px] font-bold mb-3">Nuevo préstamo</h2>
          <div className="flex flex-col gap-2.5">
            <input
              name="name"
              required
              placeholder="Nombre (ej. Préstamo del carro)"
              className="border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
            />
            <input
              name="principal"
              inputMode="decimal"
              required
              placeholder="Monto (RD$)"
              className="border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
            />
            <input
              name="annualInterestRate"
              inputMode="decimal"
              required
              placeholder="Tasa anual (%)"
              className="border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
            />
            <input
              type="number"
              name="termMonths"
              required
              placeholder="Plazo (meses)"
              className="border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
            />
            <input
              type="date"
              name="startDate"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
            />
            <button type="submit" className="rounded-[11px] bg-forest text-white font-bold text-[13.3px] py-2.5">
              Crear préstamo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
