"use client";

import { useRef, useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { updatePaymentMethod } from "@/lib/actions/payment-methods";

type Method = {
  id: string;
  name: string;
  kind: "cash" | "debit" | "credit";
  statementDay: number | null;
  paymentDay: number | null;
};

export function EditPaymentMethodButton({ method }: { method: Method }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [kind, setKind] = useState(method.kind);
  const [isPending, startTransition] = useTransition();

  function open() {
    setKind(method.kind);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updatePaymentMethod(method.id, formData);
      close();
    });
  }

  return (
    <>
      <button onClick={open} className="text-ink-muted hover:text-forest p-1" aria-label="Editar método de pago">
        <Pencil size={14} strokeWidth={1.8} />
      </button>

      <dialog
        ref={dialogRef}
        className="rounded-[20px] p-0 max-w-[380px] w-[92vw] backdrop:bg-black/40 backdrop:backdrop-blur-sm border-none shadow-2xl"
      >
        <form action={handleSubmit} className="p-5">
          <h3 className="text-[16.5px] font-bold mb-4">Editar método de pago</h3>
          <div className="flex flex-col gap-2.5">
            <input
              name="name"
              required
              defaultValue={method.name}
              className="border border-border rounded-[11px] px-3 py-2 text-[13.5px] bg-surface"
            />
            <select
              name="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
              className="border border-border rounded-[11px] px-3 py-2 text-[13.5px] bg-surface"
            >
              <option value="credit">Tarjeta de crédito</option>
              <option value="debit">Tarjeta de débito</option>
              <option value="cash">Efectivo</option>
            </select>
            {kind === "credit" ? (
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                    Día de corte
                  </label>
                  <input
                    type="number"
                    name="statementDay"
                    min={1}
                    max={31}
                    required
                    defaultValue={method.statementDay ?? undefined}
                    className="w-full mt-1.5 border border-border rounded-[11px] px-2.5 py-2 text-[13.5px] bg-surface"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                    Día de pago
                  </label>
                  <input
                    type="number"
                    name="paymentDay"
                    min={1}
                    max={31}
                    required
                    defaultValue={method.paymentDay ?? undefined}
                    className="w-full mt-1.5 border border-border rounded-[11px] px-2.5 py-2 text-[13.5px] bg-surface"
                  />
                </div>
              </div>
            ) : null}
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
