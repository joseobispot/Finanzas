"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePayableMovement } from "@/lib/actions/payables";

export function DeleteMovementButton({ payableId, id }: { payableId: string; id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (confirm("¿Eliminar este movimiento?")) {
          startTransition(() => deletePayableMovement(payableId, id));
        }
      }}
      className="text-ink-muted hover:text-critical disabled:opacity-50 p-1"
      aria-label="Eliminar movimiento"
    >
      <Trash2 size={14} strokeWidth={1.8} />
    </button>
  );
}
