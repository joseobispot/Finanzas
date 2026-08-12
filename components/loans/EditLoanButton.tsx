"use client";

import { useRef, useTransition } from "react";
import { Pencil } from "lucide-react";
import { updateLoan } from "@/lib/actions/loans";

type Loan = {
  id: string;
  name: string;
  principal: number;
  annualInterestRate: number;
  termMonths: number;
  startDate: string;
};

export function EditLoanButton({ loan }: { loan: Loan }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    dialogRef.current?.close();
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateLoan(loan.id, formData);
      close();
    });
  }

  return (
    <>
      <button
        onClick={() => dialogRef.current?.showModal()}
        className="flex items-center gap-1.5 text-[12.6px] font-bold text-forest"
      >
        <Pencil size={14} strokeWidth={1.8} />
        Editar préstamo
      </button>

      <dialog
        ref={dialogRef}
        className="rounded-[20px] p-0 max-w-[380px] w-[92vw] backdrop:bg-black/40 backdrop:backdrop-blur-sm border-none shadow-2xl"
      >
        <form action={handleSubmit} className="p-5">
          <h3 className="text-[16.5px] font-bold mb-4">Editar préstamo</h3>
          <div className="flex flex-col gap-2.5">
            <input
              name="name"
              required
              defaultValue={loan.name}
              placeholder="Nombre (ej. Préstamo del carro)"
              className="border border-border rounded-[11px] px-3 py-2 text-[13.5px] bg-surface"
            />
            <input
              name="principal"
              inputMode="decimal"
              required
              defaultValue={loan.principal}
              placeholder="Monto (RD$)"
              className="border border-border rounded-[11px] px-3 py-2 text-[13.5px] bg-surface"
            />
            <input
              name="annualInterestRate"
              inputMode="decimal"
              required
              defaultValue={loan.annualInterestRate}
              placeholder="Tasa anual (%)"
              className="border border-border rounded-[11px] px-3 py-2 text-[13.5px] bg-surface"
            />
            <input
              type="number"
              name="termMonths"
              required
              defaultValue={loan.termMonths}
              placeholder="Plazo (meses)"
              className="border border-border rounded-[11px] px-3 py-2 text-[13.5px] bg-surface"
            />
            <input
              type="date"
              name="startDate"
              defaultValue={loan.startDate}
              className="border border-border rounded-[11px] px-3 py-2 text-[13.5px] bg-surface"
            />
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
