import { percentDelta } from "@/lib/dashboard-data";

/**
 * Rojo se reserva para alertas críticas (presupuesto excedido), nunca para una
 * variación normal de gastos — por eso lo "desfavorable" usa un tono neutro, no crítico.
 */
export function DeltaPill({
  current,
  previous,
  favorableWhenUp,
  compact = false,
}: {
  current: number;
  previous: number;
  favorableWhenUp: boolean;
  compact?: boolean;
}) {
  const delta = percentDelta(current, previous);
  if (delta === null) return null;

  const isUp = delta >= 0;
  const favorable = isUp === favorableWhenUp;
  const arrow = isUp ? "↑" : "↓";
  const text = `${arrow} ${Math.abs(delta).toFixed(1)}%`;

  const toneClass = favorable
    ? "bg-forest-tint text-forest"
    : "bg-surface-2 text-ink-muted";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold ${toneClass} ${
        compact ? "text-[11px] px-2 py-[3px]" : "text-[12.3px] px-2.5 py-1"
      }`}
    >
      {text}
    </span>
  );
}
