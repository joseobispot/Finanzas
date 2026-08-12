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
