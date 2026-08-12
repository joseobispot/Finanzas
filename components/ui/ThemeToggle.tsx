"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useIsClient } from "@/lib/use-is-client";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsClient();

  if (!mounted) return <div className={`w-7 h-7 ${className}`} />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${className}`}
    >
      {isDark ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
    </button>
  );
}
