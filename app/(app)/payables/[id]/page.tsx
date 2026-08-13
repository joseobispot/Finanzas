import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireHousehold } from "@/lib/household";
import { addPayableMovement } from "@/lib/actions/payables";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { EditPayableButton } from "@/components/payables/EditPayableButton";
import { DeletePayableButton } from "@/components/payables/DeletePayableButton";
import { DeleteMovementButton } from "@/components/payables/DeleteMovementButton";

export default async function PayableDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, householdId } = await requireHousehold();

  const { data: payable } = await supabase
    .from("payables")
    .select("id, name, emoji")
    .eq("household_id", householdId)
    .eq("id", id)
    .single();

  if (!payable) notFound();

  const { data: movements } = await supabase
    .from("payable_movements")
    .select("id, type, amount, occurred_on, note")
    .eq("payable_id", id)
    .order("occurred_on", { ascending: false });

  const balance = (movements ?? []).reduce(
    (s, m) => s + (m.type === "charge" ? Number(m.amount) : -Number(m.amount)),
    0,
  );

  return (
    <div>
      <Link href="/payables" className="inline-flex items-center gap-1 text-[12.8px] font-semibold text-ink-muted mb-4">
        <ChevronLeft size={15} /> Fiado
      </Link>

      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-[13px] bg-warning-tint text-warning flex items-center justify-center text-xl flex-none">
            {payable.emoji ?? "🛒"}
          </div>
          <h1 className="text-[23px] font-bold tracking-tight">{payable.name}</h1>
        </div>
        <div className="flex items-center gap-4">
          <EditPayableButton payable={payable} />
          <DeletePayableButton id={payable.id} name={payable.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-[18px] shadow-sm p-5">
            <div className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
              {balance > 0 ? "Debes" : "Al día"}
            </div>
            <div className="text-[28px] font-extrabold tnum mt-1">{formatCurrency(balance)}</div>
          </div>

          <div className="bg-surface border border-border rounded-[18px] shadow-sm p-5">
            <h2 className="text-[15.5px] font-bold mb-3">Movimientos</h2>
            <div className="flex flex-col gap-1">
              {(movements ?? []).map((m, i) => (
                <div key={m.id} className={`flex items-center gap-3 py-2 ${i > 0 ? "border-t border-border" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold">
                      {m.type === "charge" ? "Compra a crédito" : "Pago"} · {formatShortDate(m.occurred_on)}
                    </div>
                    {m.note ? <div className="text-[11.5px] text-ink-muted">{m.note}</div> : null}
                  </div>
                  <div className={`text-[13px] font-bold tnum ${m.type === "charge" ? "" : "text-forest"}`}>
                    {m.type === "charge" ? "+" : "−"}
                    {formatCurrency(Number(m.amount))}
                  </div>
                  <DeleteMovementButton payableId={payable.id} id={m.id} />
                </div>
              ))}
              {(movements ?? []).length === 0 ? (
                <p className="text-[12.3px] text-ink-muted">Sin movimientos todavía.</p>
              ) : null}
            </div>
          </div>
        </div>

        <form action={addPayableMovement} className="bg-surface border border-border rounded-[18px] shadow-sm p-5 h-fit">
          <input type="hidden" name="payableId" value={payable.id} />
          <h2 className="text-[15.5px] font-bold mb-3">Nuevo movimiento</h2>
          <div className="flex flex-col gap-2.5">
            <select name="type" className="border border-border rounded-[11px] px-3 py-2 text-[13.5px] bg-surface">
              <option value="charge">Compra a crédito</option>
              <option value="payment">Pago</option>
            </select>
            <input
              name="amount"
              inputMode="decimal"
              required
              placeholder="Monto (RD$)"
              className="border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
            />
            <input
              type="date"
              name="occurredOn"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
            />
            <input
              name="note"
              placeholder="Nota (ej. detergente, jabón)"
              className="border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
            />
            <button type="submit" className="rounded-[11px] bg-forest text-white font-bold text-[13.3px] py-2.5">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
