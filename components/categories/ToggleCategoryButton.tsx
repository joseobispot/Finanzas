"use client";

import { useTransition } from "react";
import { setCategoryActive } from "@/lib/actions/categories";

export function ToggleCategoryButton({ id, active }: { id: string; active: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => setCategoryActive(id, !active))}
      className={`text-[11.5px] font-bold px-2.5 py-1 rounded-full disabled:opacity-50 ${
        active ? "bg-surface-2 text-ink-muted" : "bg-forest-tint text-forest"
      }`}
    >
      {active ? "Archivar" : "Reactivar"}
    </button>
  );
}
