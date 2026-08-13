"use client";

import { useRef, useTransition } from "react";
import { Pencil } from "lucide-react";
import { updatePayable } from "@/lib/actions/payables";

export function EditPayableButton({ payable }: { payable: { id: string; name: string; emoji: string | null } }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    dialogRef.current?.close();
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updatePayable(payable.id, formData);
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
        Editar
      </button>

      <dialog
        ref={dialogRef}
        className="rounded-[20px] p-0 max-w-[380px] w-[92vw] backdrop:bg-black/40 backdrop:backdrop-blur-sm border-none shadow-2xl"
      >
        <form action={handleSubmit} className="p-5">
          <h3 className="text-[16.5px] font-bold mb-4">Editar</h3>
          <div className="flex gap-2">
            <input
              name="emoji"
              defaultValue={payable.emoji ?? "🛒"}
              maxLength={4}
              className="w-14 border border-border rounded-[11px] px-2 py-2 text-center text-lg bg-surface"
            />
            <input
              name="name"
              required
              defaultValue={payable.name}
              className="flex-1 border border-border rounded-[11px] px-3 py-2 text-[13.5px] bg-surface"
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
