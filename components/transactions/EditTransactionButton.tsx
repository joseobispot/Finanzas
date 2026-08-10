"use client";

import { useRef, useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { updateTransaction } from "@/lib/actions/transactions";

type Category = { id: string; name: string; emoji: string | null; type: "expense" | "income" };

type Transaction = {
  id: string;
  type: "expense" | "income";
  amount: number;
  categoryId: string;
  occurredOn: string;
  description: string | null;
};

export function EditTransactionButton({
  transaction,
  categories,
}: {
  transaction: Transaction;
  categories: Category[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [type, setType] = useState<"expense" | "income">(transaction.type);
  const [isPending, startTransition] = useTransition();

  const filteredCategories = categories.filter((c) => c.type === type);

  function open() {
    setType(transaction.type);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateTransaction(transaction.id, formData);
      close();
    });
  }

  return (
    <>
      <button
        onClick={open}
        className="text-ink-muted hover:text-forest p-1"
        aria-label="Editar"
      >
        <Pencil size={15} strokeWidth={1.8} />
      </button>

      <dialog
        ref={dialogRef}
        className="rounded-[20px] p-0 max-w-[380px] w-[92vw] backdrop:bg-black/40 backdrop:backdrop-blur-sm border-none shadow-2xl"
      >
        <form action={handleSubmit} className="p-5">
          <h3 className="text-[16.5px] font-bold">Editar movimiento</h3>

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
            <label className="text-[11.5px] font-bold uppercase tracking-wide text-ink-muted">
              Monto
            </label>
            <div className="flex items-center gap-1.5 mt-1.5 border border-border rounded-xl px-3 py-2.5">
              <span className="font-bold text-ink-muted">RD$</span>
              <input
                name="amount"
                inputMode="decimal"
                required
                defaultValue={transaction.amount}
                className="border-none outline-none text-lg font-bold w-full bg-transparent tnum"
              />
            </div>
          </div>

          <div className="mt-3.5">
            <label className="text-[11.5px] font-bold uppercase tracking-wide text-ink-muted">
              Categoría
            </label>
            <select
              name="categoryId"
              required
              defaultValue={transaction.categoryId}
              className="w-full mt-1.5 border border-border rounded-[11px] px-2.5 py-2 text-[13.5px] bg-surface"
            >
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-2.5 mt-3.5">
            <div>
              <label className="text-[11.5px] font-bold uppercase tracking-wide text-ink-muted">
                Fecha
              </label>
              <input
                type="date"
                name="occurredOn"
                defaultValue={transaction.occurredOn}
                className="w-full mt-1.5 border border-border rounded-[11px] px-2.5 py-2 text-[13.5px] bg-surface"
              />
            </div>
            <div>
              <label className="text-[11.5px] font-bold uppercase tracking-wide text-ink-muted">
                Descripción (opcional)
              </label>
              <input
                type="text"
                name="description"
                defaultValue={transaction.description ?? ""}
                placeholder="Ej. compra en el súper"
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
