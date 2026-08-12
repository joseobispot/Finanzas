"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteLoan } from "@/lib/actions/loans";

export function DeleteLoanButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (confirm(`¿Eliminar el préstamo "${name}"? Se borrarán también sus pagos registrados.`)) {
          startTransition(() => deleteLoan(id));
        }
      }}
      className="flex items-center gap-1.5 text-[12.6px] font-bold text-critical disabled:opacity-50"
    >
      <Trash2 size={14} strokeWidth={1.8} />
      Eliminar préstamo
    </button>
  );
}
