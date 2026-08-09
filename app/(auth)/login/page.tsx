import { login } from "@/lib/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-2.5 mb-8 justify-center">
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[15px] font-extrabold text-navy-ink bg-gradient-to-br from-forest to-forest-strong">
          $
        </div>
        <span className="text-[15px] font-bold">Finanzas</span>
      </div>

      <div className="bg-surface border border-border rounded-2xl shadow-sm p-7">
        <h1 className="text-lg font-bold">Bienvenido de vuelta</h1>
        <p className="text-sm text-ink-muted mt-1">Entra a tus finanzas compartidas</p>

        {error ? (
          <p className="mt-4 text-sm font-medium text-critical bg-critical-tint rounded-lg px-3 py-2">
            {error}
          </p>
        ) : null}

        <form action={login} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
              Correo
            </label>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest"
            />
          </div>
          <button
            type="submit"
            className="mt-2 rounded-xl bg-forest text-white font-bold text-sm py-2.5 hover:brightness-105 active:scale-[.99] transition"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
