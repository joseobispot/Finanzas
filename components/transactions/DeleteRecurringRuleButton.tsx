"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteRecurringRule } from "@/lib/actions/recurring";

export function DeleteRecurringRuleButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (confirm(`¿Eliminar la regla recurrente "${name}"?`)) {
          startTransition(() => deleteRecurringRule(id));
        }
      }}
      className="text-ink-muted hover:text-critical disabled:opacity-50 p-1"
      aria-label="Eliminar regla recurrente"
    >
      <Trash2 size={14} strokeWidth={1.8} />
    </button>
  );
}
