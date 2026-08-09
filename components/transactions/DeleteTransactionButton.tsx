"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTransaction } from "@/lib/actions/transactions";

export function DeleteTransactionButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (confirm("¿Eliminar este movimiento?")) {
          startTransition(() => deleteTransaction(id));
        }
      }}
      className="text-ink-muted hover:text-critical disabled:opacity-50 p-1"
      aria-label="Eliminar"
    >
      <Trash2 size={15} strokeWidth={1.8} />
    </button>
  );
}
