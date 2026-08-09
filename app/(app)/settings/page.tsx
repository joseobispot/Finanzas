import Link from "next/link";
import { requireHousehold } from "@/lib/household";
import { logout } from "@/lib/actions/auth";
import { ThemeToggleRow } from "@/components/ui/ThemeToggleRow";

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

        <Link
          href="/categories"
          className="bg-surface border border-border rounded-[18px] shadow-sm p-5 hover:border-forest transition-colors md:col-span-2"
        >
          <h2 className="text-[15.5px] font-bold">Categorías</h2>
          <p className="text-[12.8px] text-ink-muted mt-1">Edita o agrega categorías de gastos e ingresos</p>
        </Link>
      </div>
    </div>
  );
}
