import Link from "next/link";
import { requireHousehold } from "@/lib/household";
import { createPayable } from "@/lib/actions/payables";
import { formatCurrency } from "@/lib/format";

export default async function PayablesPage() {
  const { supabase, householdId } = await requireHousehold();

  const { data: payables } = await supabase
    .from("payables")
    .select("id, name, emoji, payable_balances(balance)")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[23px] font-bold tracking-tight">Fiado</h1>
        <p className="text-ink-muted text-[13.8px] mt-0.5">
          Cuentas informales a crédito (ej. la tienda de un familiar) — sin interés ni cuotas fijas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
          {(payables ?? []).map((p) => {
            const balanceEntry = Array.isArray(p.payable_balances) ? p.payable_balances[0] : p.payable_balances;
            const balance = Number(balanceEntry?.balance ?? 0);
            return (
              <Link
                key={p.id}
                href={`/payables/${p.id}`}
                className="bg-surface border border-border rounded-[18px] shadow-sm p-5 hover:border-forest transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-[11px] bg-warning-tint text-warning flex items-center justify-center text-base flex-none">
                    {p.emoji ?? "🛒"}
                  </div>
                  <div className="text-[14.6px] font-bold">{p.name}</div>
                </div>
                <div className="text-[22px] font-extrabold tnum mt-4">{formatCurrency(balance)}</div>
                <div className="text-[12.3px] text-ink-muted mt-0.5">
                  {balance > 0 ? "Debes esto" : "Al día"}
                </div>
              </Link>
            );
          })}
          {(payables ?? []).length === 0 ? (
            <p className="text-[12.8px] text-ink-muted py-4">Sin cuentas de fiado todavía.</p>
          ) : null}
        </div>

        <form action={createPayable} className="bg-surface border border-border rounded-[18px] shadow-sm p-5 h-fit">
          <h2 className="text-[15.5px] font-bold mb-3">Nueva cuenta</h2>
          <div className="flex flex-col gap-2.5">
            <div className="flex gap-2">
              <input
                name="emoji"
                placeholder="🛒"
                maxLength={4}
                className="w-14 border border-border rounded-[11px] px-2 py-2 text-center text-lg"
              />
              <input
                name="name"
                required
                placeholder="Nombre (ej. Tienda de mamá)"
                className="flex-1 border border-border rounded-[11px] px-3 py-2 text-[13.5px]"
              />
            </div>
            <button type="submit" className="rounded-[11px] bg-forest text-white font-bold text-[13.3px] py-2.5">
              Crear cuenta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
