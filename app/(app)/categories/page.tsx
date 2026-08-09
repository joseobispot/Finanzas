import { requireHousehold } from "@/lib/household";
import { createCategory } from "@/lib/actions/categories";
import { ToggleCategoryButton } from "@/components/categories/ToggleCategoryButton";

export default async function CategoriesPage() {
  const { supabase, householdId } = await requireHousehold();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, type, emoji, is_active")
    .eq("household_id", householdId)
    .order("type")
    .order("name");

  const expense = (categories ?? []).filter((c) => c.type === "expense");
  const income = (categories ?? []).filter((c) => c.type === "income");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[23px] font-bold tracking-tight">Categorías</h1>
        <p className="text-ink-muted text-[13.8px] mt-0.5">
          Edita las categorías predefinidas o agrega las que necesites
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_320px] gap-4">
        <CategoryList title="Gastos" items={expense} />
        <CategoryList title="Ingresos" items={income} />

        <form
          action={createCategory}
          className="bg-surface border border-border rounded-[18px] shadow-sm p-5 h-fit"
        >
          <h2 className="text-[15.5px] font-bold mb-3">Nueva categoría</h2>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                name="emoji"
                placeholder="📦"
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
            <select
              name="type"
              className="border border-border rounded-[11px] px-3 py-2 text-[13.5px] bg-surface"
            >
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
            <button
              type="submit"
              className="rounded-[11px] bg-forest text-white font-bold text-[13.3px] py-2.5"
            >
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoryList({
  title,
  items,
}: {
  title: string;
  items: { id: string; name: string; emoji: string | null; is_active: boolean }[];
}) {
  return (
    <div className="bg-surface border border-border rounded-[18px] shadow-sm p-5 h-fit">
      <h2 className="text-[15.5px] font-bold mb-3">{title}</h2>
      <div className="flex flex-col gap-1">
        {items.map((c) => (
          <div key={c.id} className="flex items-center gap-3 py-2">
            <div className="w-9 h-9 rounded-[11px] bg-surface-2 flex items-center justify-center text-base flex-none">
              {c.emoji ?? "📦"}
            </div>
            <div className={`flex-1 text-[13.4px] font-semibold ${!c.is_active ? "text-ink-muted line-through" : ""}`}>
              {c.name}
            </div>
            <ToggleCategoryButton id={c.id} active={c.is_active} />
          </div>
        ))}
        {items.length === 0 ? (
          <p className="text-[12.8px] text-ink-muted py-2">Sin categorías todavía.</p>
        ) : null}
      </div>
    </div>
  );
}
