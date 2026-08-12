import Link from "next/link";
import { requireHousehold } from "@/lib/household";
import { logout } from "@/lib/actions/auth";
import { ThemeToggleRow } from "@/components/ui/ThemeToggleRow";
import { CreatePaymentMethodForm } from "@/components/payment-methods/CreatePaymentMethodForm";
import { EditPaymentMethodButton } from "@/components/payment-methods/EditPaymentMethodButton";
import { DeletePaymentMethodButton } from "@/components/payment-methods/DeletePaymentMethodButton";

const KIND_LABEL: Record<string, string> = {
  cash: "Efectivo",
  debit: "Débito",
  credit: "Crédito",
};

export default async function SettingsPage() {
  const { supabase, user, householdId } = await requireHousehold();

  const { data: household } = await supabase
    .from("households")
    .select("name, created_at")
    .eq("id", householdId)
    .single();

  const { count: memberCount } = await supabase
    .from("household_members")
    .select("id", { count: "exact", head: true })
    .eq("household_id", householdId);

  const { data: paymentMethods } = await supabase
    .from("payment_methods")
    .select("id, name, kind, statement_day, payment_day")
    .eq("household_id", householdId)
    .order("created_at");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[23px] font-bold tracking-tight">Configuración</h1>
        <p className="text-ink-muted text-[13.8px] mt-0.5">Tu cuenta y tu hogar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
        <div className="bg-surface border border-border rounded-[18px] shadow-sm p-5">
          <h2 className="text-[15.5px] font-bold mb-3">Cuenta</h2>
          <p className="text-[13.4px]">{user.email}</p>
          <form action={logout} className="mt-4">
            <button
              type="submit"
              className="rounded-[11px] bg-surface-2 text-ink font-bold text-[13px] px-4 py-2"
            >
              Cerrar sesión
            </button>
          </form>
        </div>

        <div className="bg-surface border border-border rounded-[18px] shadow-sm p-5">
          <h2 className="text-[15.5px] font-bold mb-3">Hogar</h2>
          <p className="text-[13.4px] font-semibold">{household?.name ?? "Hogar"}</p>
          <p className="text-[12.6px] text-ink-muted mt-1">{memberCount ?? 1} miembro(s)</p>
        </div>

        <div className="bg-surface border border-border rounded-[18px] shadow-sm p-5 md:col-span-2">
          <h2 className="text-[15.5px] font-bold">Apariencia</h2>
          <p className="text-[12.6px] text-ink-muted mt-1">Modo claro, oscuro o según tu dispositivo</p>
          <ThemeToggleRow />
        </div>

        <div className="bg-surface border border-border rounded-[18px] shadow-sm p-5 md:col-span-2">
          <h2 className="text-[15.5px] font-bold">💳 Tarjetas y métodos de pago</h2>
          <p className="text-[12.6px] text-ink-muted mt-1 mb-3">
            Regístralas para poder decir con qué pagaste cada gasto, y para que tu tarjeta de crédito te avise en
            &quot;Próximos pagos&quot; cuándo toca pagar.
          </p>
          <div className="flex flex-col gap-1 mb-4">
            {(paymentMethods ?? []).map((m, i) => (
              <div
                key={m.id}
                className={`flex items-center gap-2.5 py-2 ${i > 0 ? "border-t border-border" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13.2px] font-semibold truncate">{m.name}</div>
                  <div className="text-[11px] text-ink-muted">
                    {KIND_LABEL[m.kind]}
                    {m.kind === "credit" ? ` · Corte día ${m.statement_day} · Pago día ${m.payment_day}` : ""}
                  </div>
                </div>
                <EditPaymentMethodButton
                  method={{
                    id: m.id,
                    name: m.name,
                    kind: m.kind,
                    statementDay: m.statement_day,
                    paymentDay: m.payment_day,
                  }}
                />
                <DeletePaymentMethodButton id={m.id} name={m.name} />
              </div>
            ))}
            {(paymentMethods ?? []).length === 0 ? (
              <p className="text-[12.3px] text-ink-muted">Sin tarjetas ni métodos de pago todavía.</p>
            ) : null}
          </div>
          <CreatePaymentMethodForm />
        </div>

        <div className="md:col-span-2">
          <h2 className="text-[13px] font-bold text-ink-muted uppercase tracking-wide mb-2">Más secciones</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/loans"
              className="bg-surface border border-border rounded-[18px] shadow-sm p-4 hover:border-forest transition-colors"
            >
              <h3 className="text-[14px] font-bold">🏦 Deudas</h3>
              <p className="text-[12.3px] text-ink-muted mt-1">Préstamos y su amortización</p>
            </Link>
            <Link
              href="/categories"
              className="bg-surface border border-border rounded-[18px] shadow-sm p-4 hover:border-forest transition-colors"
            >
              <h3 className="text-[14px] font-bold">🏷️ Categorías</h3>
              <p className="text-[12.3px] text-ink-muted mt-1">Edita o agrega categorías</p>
            </Link>
            <Link
              href="/reports"
              className="bg-surface border border-border rounded-[18px] shadow-sm p-4 hover:border-forest transition-colors"
            >
              <h3 className="text-[14px] font-bold">📊 Reportes</h3>
              <p className="text-[12.3px] text-ink-muted mt-1">Comparación mes a mes</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
