"use client";

import { useTheme } from "next-themes";
import { useIsClient } from "@/lib/use-is-client";

const OPTIONS = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
  { value: "system", label: "Sistema" },
] as const;

export function ThemeToggleRow() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsClient();

  return (
    <div className="flex bg-surface-2 rounded-[11px] p-[3px] mt-3">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setTheme(opt.value)}
          className={`flex-1 py-2 rounded-[9px] text-[12.8px] font-bold transition-colors ${
            mounted && theme === opt.value ? "bg-surface text-ink shadow-sm" : "text-ink-muted"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
