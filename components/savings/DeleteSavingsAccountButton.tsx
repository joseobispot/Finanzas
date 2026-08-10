"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteSavingsAccount } from "@/lib/actions/savings";

export function DeleteSavingsAccountButton({
  id,
  isGoal,
  name,
}: {
  id: string;
  isGoal: boolean;
  name: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (confirm(`¿Eliminar "${name}"? Se borrarán también sus movimientos.`)) {
          startTransition(() => deleteSavingsAccount(id, isGoal));
        }
      }}
      className="flex items-center gap-1.5 text-[12.6px] font-bold text-critical disabled:opacity-50"
    >
      <Trash2 size={14} strokeWidth={1.8} />
      Eliminar {isGoal ? "meta" : "cuenta"}
    </button>
  );
}
