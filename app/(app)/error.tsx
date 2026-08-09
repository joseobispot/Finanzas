"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24">
      <div className="text-3xl mb-3">😕</div>
      <h2 className="text-[16px] font-bold">Algo salió mal</h2>
      <p className="text-[13px] text-ink-muted mt-1.5 max-w-sm">{error.message}</p>
      <button
        onClick={reset}
        className="mt-5 rounded-[11px] bg-forest text-white font-bold text-[13.3px] px-4 py-2.5"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
