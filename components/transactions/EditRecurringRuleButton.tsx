"use client";

import { useRef, useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { updateRecurringRule } from "@/lib/actions/recurring";

type Category = { id: string; name: string; emoji: string | null; type: "expense" | "income" };

type Rule = {
  id: string;
  type: "expense" | "income";
  amount: number;
  categoryId: string;
  description: string | null;
  dayOfMonth: number;
  startDate: string;
};

export function EditRecurringRuleButton({
  rule,
  categories,
}: {
  rule: Rule;
  categories: Category[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [type, setType] = useState<"expense" | "income">(rule.type);
  const [isPending, startTransition] = useTransition();

  const filteredCategories = categories.filter((c) => c.type === type);

  function open() {
    setType(rule.type);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateRecurringRule(rule.id, formData);
      close();
    });
  }

  return (
    <>
      <button onClick={open} className="text-ink-muted hover:text-forest p-1" aria-label="Editar regla recurrente">
        <Pencil size={14} strokeWidth={1.8} />
      </button>

      <dialog
        ref={dialogRef}
        className="rounded-[20px] p-0 max-w-[380px] w-[92vw] backdrop:bg-black/40 backdrop:backdrop-blur-sm border-none shadow-2xl"
      >
        <form action={handleSubmit} className="p-5">
          <h3 className="text-[16.5px] font-bold">Editar regla recurrente</h3>

          <div className="flex bg-surface-2 rounded-[11px] p-[3px] mt-4">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex-1 py-2 rounded-[9px] text-sm font-bold transition-colors ${
                type === "expense" ? "bg-surface text-ink shadow-sm" : "text-ink-muted"
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex-1 py-2 rounded-[9px] text-sm font-bold transition-colors ${
                type === "income" ? "bg-surface text-ink shadow-sm" : "text-ink-muted"
              }`}
            >
              Ingreso
            </button>
          </div>
          <input type="hidden" name="type" value={type} />

          <div className="mt-3.5">
            <label className="text-[11.5px] font-bold uppercase tracking-wide text-ink-muted">Monto</label>
            <div className="flex items-center gap-1.5 mt-1.5 border border-border rounded-xl px-3 py-2.5">
              <span className="font-bold text-ink-muted">RD$</span>
              <input
                name="amount"
                inputMode="decimal"
                required
                defaultValue={rule.amount}
                className="border-none outline-none text-lg font-bold w-full bg-transparent tnum"
              />
            </div>
          </div>

          <div className="mt-3.5">
            <label className="text-[11.5px] font-bold uppercase tracking-wide text-ink-muted">Categoría</label>
            <select
              name="categoryId"
              required
              defaultValue={rule.categoryId}
              className="w-full mt-1.5 border border-border rounded-[11px] px-2.5 py-2 text-[13.5px] bg-surface"
            >
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3.5">
            <label className="text-[11.5px] font-bold uppercase tracking-wide text-ink-muted">
              Descripción (ej. Netflix)
            </label>
            <input
              type="text"
              name="description"
              defaultValue={rule.description ?? ""}
              className="w-full mt-1.5 border border-border rounded-[11px] px-2.5 py-2 text-[13.5px] bg-surface"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-3.5">
            <div>
              <label className="text-[11.5px] font-bold uppercase tracking-wide text-ink-muted">Día de pago</label>
              <input
                type="number"
                name="dayOfMonth"
                min={1}
                max={31}
                required
                defaultValue={rule.dayOfMonth}
                className="w-full mt-1.5 border border-border rounded-[11px] px-2.5 py-2 text-[13.5px] bg-surface"
              />
            </div>
            <div>
              <label className="text-[11.5px] font-bold uppercase tracking-wide text-ink-muted">Desde</label>
              <input
                type="date"
                name="startDate"
                defaultValue={rule.startDate}
                className="w-full mt-1.5 border border-border rounded-[11px] px-2.5 py-2 text-[13.5px] bg-surface"
              />
            </div>
          </div>

          <div className="flex gap-2.5 mt-5">
            <button
              type="button"
              onClick={close}
              className="flex-1 rounded-[11px] bg-surface-2 text-ink font-bold text-[13.3px] py-2.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-[11px] bg-forest text-white font-bold text-[13.3px] py-2.5 disabled:opacity-60"
            >
              {isPending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
