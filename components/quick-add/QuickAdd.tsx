"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createTransaction } from "@/lib/actions/transactions";

type Category = { id: string; name: string; emoji: string | null; type: "expense" | "income" };
type PaymentMethod = { id: string; name: string; kind: "cash" | "debit" | "credit" };

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function QuickAdd({
  categories,
  paymentMethods,
}: {
  categories: Category[];
  paymentMethods: PaymentMethod[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [showMore, setShowMore] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  function open() {
    setType("expense");
    setShowMore(false);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function lastCategoryFor(t: "expense" | "income") {
    if (typeof window === "undefined") return undefined;
    return window.localStorage.getItem(`lastCategory:${t}`) ?? undefined;
  }

  function lastPaymentMethod() {
    if (typeof window === "undefined") return undefined;
    return window.localStorage.getItem("lastPaymentMethod") ?? undefined;
  }

  function handleSubmit(formData: FormData) {
    const categoryId = String(formData.get("categoryId"));
    const paymentMethodId = String(formData.get("paymentMethodId") ?? "");
    startTransition(async () => {
      await createTransaction(formData);
      window.localStorage.setItem(`lastCategory:${type}`, categoryId);
      if (paymentMethodId) window.localStorage.setItem("lastPaymentMethod", paymentMethodId);
      close();
    });
  }

  return (
    <>
      <button
        onClick={open}
        className="fixed right-5 bottom-20 md:right-8 md:bottom-8 z-30 inline-flex items-center gap-1.5 rounded-[13px] bg-forest text-white font-bold text-sm px-4 py-3 shadow-[0_10px_26px_-6px_rgba(14,107,76,0.45)] hover:brightness-105 active:scale-[.98] transition"
      >
        <Plus size={16} strokeWidth={2.2} />
        Nuevo movimiento
      </button>

      <dialog
        ref={dialogRef}
        className="rounded-[20px] p-0 max-w-[380px] w-[92vw] backdrop:bg-black/40 backdrop:backdrop-blur-sm border-none shadow-2xl"
      >
        <form action={handleSubmit} className="p-5">
          <h3 className="text-[16.5px] font-bold">Nuevo movimiento</h3>

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
                placeholder="0.00"
                required
                autoFocus
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
              defaultValue={lastCategoryFor(type)}
              className="w-full mt-1.5 border border-border rounded-[11px] px-2.5 py-2 text-[13.5px] bg-surface"
            >
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="mt-3.5 text-[12.6px] font-bold text-forest"
          >
            {showMore ? "− Menos detalles" : "+ Más detalles"}
          </button>

          {showMore ? (
            <div className="grid grid-cols-1 gap-2.5 mt-2.5">
              <div>
                <label className="text-[11.5px] font-bold uppercase tracking-wide text-ink-muted">
                  Fecha
                </label>
                <input
                  type="date"
                  name="occurredOn"
                  defaultValue={today()}
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
                  placeholder="Ej. compra en el súper"
                  className="w-full mt-1.5 border border-border rounded-[11px] px-2.5 py-2 text-[13.5px] bg-surface"
                />
              </div>
              {paymentMethods.length > 0 ? (
                <div>
                  <label className="text-[11.5px] font-bold uppercase tracking-wide text-ink-muted">
                    Método de pago (opcional)
                  </label>
                  <select
                    name="paymentMethodId"
                    defaultValue={lastPaymentMethod()}
                    className="w-full mt-1.5 border border-border rounded-[11px] px-2.5 py-2 text-[13.5px] bg-surface"
                  >
                    <option value="">Sin especificar</option>
                    {paymentMethods.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          ) : (
            <input type="hidden" name="occurredOn" value={today()} />
          )}

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
