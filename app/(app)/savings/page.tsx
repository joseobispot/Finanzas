import Link from "next/link";
import { requireHousehold } from "@/lib/household";
import { createSavingsAccount } from "@/lib/actions/savings";
import { formatCurrency } from "@/lib/format";

export default async function SavingsPage() {
  const { supabase, householdId } = await requireHousehold();

  const { data: accounts } = await supabase
    .from("savings_accounts")
    .select("id, name, kind, emoji, savings_balances(balance)")
    .eq("household_id", householdId)
    .is("goal_amount", null)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[23px] font-bold tracking-tight">Ahorros</h1>
        <p className="text-ink-muted text-[13.8px] mt-0.5">Cuentas de ahorro e inversión sin meta específica</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
          {(accounts ?? []).map((a) => {
            const balanceEntry = Array.isArray(a.savings_balances) ? a.savings_balances[0] : a.savings_balances;
            const balance = Number(balanceEntry?.balance ?? 0);
            return (
              <Link
                key={a.id}
                href={`/savings/${a.id}`}
                className="bg-surface border border-border rounded-[18px] shadow-sm p-5 hover:border-forest transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-[11px] bg-forest-tint text-forest flex items-center justify-center text-base flex-none">
                    {a.emoji ?? "🐷"}
                  </div>
                  <div>
                    <div className="text-[14.6px] font-bold">{a.name}</div>
                    <div className="text-[11.8px] text-ink-muted capitalize">
                      {a.kind === "investment" ? "Inversión" : "Ahorro"}
                    </div>
                  </div>
                </div>
                <div className="text-[22px] font-extrabold tnum mt-4">{formatCurrency(balance)}</div>
              </Link>
            );
          })}
          {(accounts ?? []).length === 0 ? (
            <p className="text-[12.8px] text-ink-muted py-4">Sin cuentas de ahorro todavía.</p>
          ) : null}
        </div>

        <form action={createSavingsAccount} className="bg-surface border border-border rounded-[18px] shadow-sm p-5 h-fit">
          <h2 className="text-[15.5px] font-bold mb-3">Nueva cuenta</h2>
          <div className="flex flex-col gap-2.5">
            <div className="flex gap-2">
              <input
                name="emoji"
                placeholder="🐷"
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
            <select name="kind" className="border border-border rounded-[11px] px-3 py-2 text-[13.5px] bg-surface">
              <option value="savings">Ahorro</option>
              <option value="investment">Inversión</option>
            </select>
            <button type="submit" className="rounded-[11px] bg-forest text-white font-bold text-[13.3px] py-2.5">
              Crear cuenta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
