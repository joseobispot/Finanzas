import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireHousehold } from "@/lib/household";
import { addLoanPayment } from "@/lib/actions/loans";
import { computeAmortizationSchedule, totalScheduledPayments } from "@/lib/amortization";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { EditLoanButton } from "@/components/loans/EditLoanButton";
import { DeleteLoanButton } from "@/components/loans/DeleteLoanButton";

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, householdId } = await requireHousehold();

  const { data: loan } = await supabase
    .from("loans")
    .select("id, name, principal, annual_interest_rate, term_months, start_date")
    .eq("household_id", householdId)
    .eq("id", id)
    .single();

  if (!loan) notFound();

  const { data: payments } = await supabase
    .from("loan_payments")
    .select("id, amount, paid_on, note")
    .eq("loan_id", id)
    .order("paid_on", { ascending: false });

  const schedule = computeAmortizationSchedule(
    Number(loan.principal),
    Number(loan.annual_interest_rate),
    loan.term_months,
    new Date(`${loan.start_date}T00:00:00`),
  );
  const totalScheduled = totalScheduledPayments(schedule);
  const paid = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const remaining = Math.max(0, totalScheduled - paid);
  const progress = totalScheduled > 0 ? Math.min(1, paid / totalScheduled) : 0;

  return (
    <div>
      <Link href="/loans" className="inline-flex items-center gap-1 text-[12.8px] font-semibold text-ink-muted mb-4">
        <ChevronLeft size={15} /> Deudas
      </Link>

      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-[23px] font-bold tracking-tight">{loan.name}</h1>
          <p className="text-ink-muted text-[13.8px] mt-0.5">
            {formatCurrency(Number(loan.principal))} · {loan.annual_interest_rate}% anual · {loan.term_months} meses
          </p>
        </div>
        <div className="flex items-center gap-4">
          <EditLoanButton
            loan={{
              id: loan.id,
              name: loan.name,
              principal: Number(loan.principal),
              annualInterestRate: Number(loan.annual_interest_rate),
              termMonths: loan.term_months,
              startDate: loan.start_date,
            }}
          />
          <DeleteLoanButton id={loan.id} name={loan.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-[18px] shadow-sm p-5">
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] font-extrabold tnum">{formatCurrency(paid)}</span>
              <span className="text-[13px] text-ink-muted font-semibold tnum">
                / {formatCurrency(totalScheduled)}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-surface-2 mt-3 overflow-hidden">
              <span
                className="block h-full rounded-full bg-forest"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2.5">
              <span className="text-[12.8px] font-bold text-forest">{Math.round(progress * 100)}% pagado</span>
              <span className="text-[12.8px] text-ink-muted">Faltan {formatCurrency(remaining)}</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-[18px] shadow-sm p-5">
            <h2 className="text-[15.5px] font-bold mb-3">Tabla de amortización</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-[12.6px] tnum">
                <thead>
                  <tr className="text-left text-ink-muted border-b border-border">
                    <th className="py-2 pr-3 font-semibold">#</th>
                    <th className="py-2 pr-3 font-semibold">Fecha</th>
                    <th className="py-2 pr-3 font-semibold text-right">Cuota</th>
                    <th className="py-2 pr-3 font-semibold text-right">Interés</th>
                    <th className="py-2 pr-3 font-semibold text-right">Capital</th>
                    <th className="py-2 font-semibold text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row) => (
                    <tr key={row.installment} className="border-b border-border last:border-0">
                      <td className="py-1.5 pr-3 text-ink-muted">{row.installment}</td>
                      <td className="py-1.5 pr-3 text-ink-muted">{formatShortDate(row.dueDate)}</td>
                      <td className="py-1.5 pr-3 text-right font-semibold">{formatCurrency(row.payment)}</td>
                      <td className="py-1.5 pr-3 text-right text-ink-muted">{formatCurrency(row.interest)}</td>
                      <td className="py-1.5 pr-3 text-right text-ink-muted">
                        {formatCurrency(row.principalPortion)}
                      </td>
                      <td className="py-1.5 text-right font-semibold">{formatCurrency(row.remainingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <form action={addLoanPayment} className="bg-surface border border-border rounded-[18px] shadow-sm p-5">
            <input type="hidden" name="loanId" value={loan.id} />
            <h2 className="text-[15.5px] font-bold mb-3">Registrar pago</h2>
            <div className="flex flex-col gap-2.5">
              <input
                name="amount"
                inputMode="decimal"
                required
                placeholder="Monto (RD$)"
                className="border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
              />
              <input
                type="date"
                name="paidOn"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
              />
              <input
                name="note"
                placeholder="Nota (opcional)"
                className="border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
              />
              <button type="submit" className="rounded-[11px] bg-forest text-white font-bold text-[13.3px] py-2.5">
                Guardar pago
              </button>
            </div>
          </form>

          <div className="bg-surface border border-border rounded-[18px] shadow-sm p-5">
            <h2 className="text-[15.5px] font-bold mb-3">Pagos registrados</h2>
            <div className="flex flex-col gap-1">
              {(payments ?? []).map((p, i) => (
                <div key={p.id} className={`flex items-center justify-between py-2 ${i > 0 ? "border-t border-border" : ""}`}>
                  <div>
                    <div className="text-[13px] font-semibold">{formatShortDate(p.paid_on)}</div>
                    {p.note ? <div className="text-[11.5px] text-ink-muted">{p.note}</div> : null}
                  </div>
                  <div className="text-[13px] font-bold tnum">{formatCurrency(Number(p.amount))}</div>
                </div>
              ))}
              {(payments ?? []).length === 0 ? (
                <p className="text-[12.3px] text-ink-muted">Sin pagos registrados todavía.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
