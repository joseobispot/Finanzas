import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireHousehold } from "@/lib/household";
import { addSavingsMovement } from "@/lib/actions/savings";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { DeleteSavingsAccountButton } from "@/components/savings/DeleteSavingsAccountButton";

export default async function SavingsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, householdId } = await requireHousehold();

  const { data: account } = await supabase
    .from("savings_accounts")
    .select("id, name, kind, emoji, goal_amount, goal_date")
    .eq("household_id", householdId)
    .eq("id", id)
    .single();

  if (!account) notFound();

  const { data: movements } = await supabase
    .from("savings_movements")
    .select("id, type, amount, occurred_on, note")
    .eq("savings_account_id", id)
    .order("occurred_on", { ascending: false });

  const balance = (movements ?? []).reduce(
    (s, m) => s + (m.type === "deposit" ? Number(m.amount) : -Number(m.amount)),
    0,
  );
  const isGoal = account.goal_amount != null;
  const progress = isGoal ? Math.min(1, balance / Number(account.goal_amount)) : 0;
  const backHref = isGoal ? "/goals" : "/savings";

  return (
    <div>
      <Link href={backHref} className="inline-flex items-center gap-1 text-[12.8px] font-semibold text-ink-muted mb-4">
        <ChevronLeft size={15} /> {isGoal ? "Metas" : "Ahorros"}
      </Link>

      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-[13px] bg-forest-tint text-forest flex items-center justify-center text-xl flex-none">
            {account.emoji ?? "🐷"}
          </div>
          <div>
            <h1 className="text-[23px] font-bold tracking-tight">{account.name}</h1>
            {isGoal ? (
              <p className="text-ink-muted text-[13.8px] mt-0.5">
                Meta: {formatCurrency(Number(account.goal_amount))}
                {account.goal_date ? ` · ${formatShortDate(account.goal_date)}` : ""}
              </p>
            ) : (
              <p className="text-ink-muted text-[13.8px] mt-0.5 capitalize">
                {account.kind === "investment" ? "Inversión" : "Ahorro"}
              </p>
            )}
          </div>
        </div>
        <DeleteSavingsAccountButton id={account.id} isGoal={isGoal} name={account.name} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-[18px] shadow-sm p-5">
            <div className="text-[28px] font-extrabold tnum">{formatCurrency(balance)}</div>
            {isGoal ? (
              <>
                <div className="h-2.5 rounded-full bg-surface-2 mt-3 overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-forest"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2.5">
                  <span className="text-[12.8px] font-bold text-forest">
                    {Math.round(progress * 100)}% completado
                  </span>
                  <span className="text-[12.8px] text-ink-muted">
                    Faltan {formatCurrency(Math.max(0, Number(account.goal_amount) - balance))}
                  </span>
                </div>
              </>
            ) : null}
          </div>

          <div className="bg-surface border border-border rounded-[18px] shadow-sm p-5">
            <h2 className="text-[15.5px] font-bold mb-3">Movimientos</h2>
            <div className="flex flex-col gap-1">
              {(movements ?? []).map((m, i) => (
                <div key={m.id} className={`flex items-center justify-between py-2 ${i > 0 ? "border-t border-border" : ""}`}>
                  <div>
                    <div className="text-[13px] font-semibold">
                      {m.type === "deposit" ? "Aporte" : "Retiro"} · {formatShortDate(m.occurred_on)}
                    </div>
                    {m.note ? <div className="text-[11.5px] text-ink-muted">{m.note}</div> : null}
                  </div>
                  <div className={`text-[13px] font-bold tnum ${m.type === "deposit" ? "text-forest" : ""}`}>
                    {m.type === "deposit" ? "+" : "−"}
                    {formatCurrency(Number(m.amount))}
                  </div>
                </div>
              ))}
              {(movements ?? []).length === 0 ? (
                <p className="text-[12.3px] text-ink-muted">Sin movimientos todavía.</p>
              ) : null}
            </div>
          </div>
        </div>

        <form action={addSavingsMovement} className="bg-surface border border-border rounded-[18px] shadow-sm p-5 h-fit">
          <input type="hidden" name="savingsAccountId" value={account.id} />
          <h2 className="text-[15.5px] font-bold mb-3">Nuevo movimiento</h2>
          <div className="flex flex-col gap-2.5">
            <select name="type" className="border border-border rounded-[11px] px-3 py-2 text-[13.5px] bg-surface">
              <option value="deposit">Aporte</option>
              <option value="withdrawal">Retiro</option>
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
              placeholder="Nota (opcional)"
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
