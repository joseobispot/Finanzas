"use client";

import { useTransition } from "react";
import { setRecurringActive } from "@/lib/actions/recurring";

export function ToggleRecurringButton({ id, active }: { id: string; active: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => setRecurringActive(id, !active))}
      className={`text-[11.5px] font-bold px-2.5 py-1 rounded-full disabled:opacity-50 ${
        active ? "bg-forest-tint text-forest" : "bg-surface-2 text-ink-muted"
      }`}
    >
      {active ? "Activa" : "Pausada"}
    </button>
  );
}
