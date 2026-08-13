"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePayable } from "@/lib/actions/payables";

export function DeletePayableButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (confirm(`¿Eliminar "${name}"? Se borrará también su historial de compras y pagos.`)) {
          startTransition(() => deletePayable(id));
        }
      }}
      className="flex items-center gap-1.5 text-[12.6px] font-bold text-critical disabled:opacity-50"
    >
      <Trash2 size={14} strokeWidth={1.8} />
      Eliminar
    </button>
  );
}
