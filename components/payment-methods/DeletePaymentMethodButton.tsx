"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePaymentMethod } from "@/lib/actions/payment-methods";

export function DeletePaymentMethodButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (confirm(`¿Eliminar "${name}"? Las transacciones que lo usaban quedarán sin método de pago.`)) {
          startTransition(() => deletePaymentMethod(id));
        }
      }}
      className="text-ink-muted hover:text-critical disabled:opacity-50 p-1"
      aria-label="Eliminar método de pago"
    >
      <Trash2 size={14} strokeWidth={1.8} />
    </button>
  );
}
