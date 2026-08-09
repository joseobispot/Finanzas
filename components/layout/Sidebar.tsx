"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";
import { logout } from "@/lib/actions/auth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Sidebar({
  userEmail,
  householdName,
}: {
  userEmail: string;
  householdName: string;
}) {
  const pathname = usePathname();
  const initials = userEmail.slice(0, 2).toUpperCase();

  return (
    <aside className="hidden md:flex w-[236px] flex-none flex-col gap-6 bg-navy text-navy-ink px-3.5 py-5 sticky top-0 h-screen">
      <div className="flex items-center gap-2.5 px-2">
        <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-base font-extrabold flex-none bg-gradient-to-br from-forest to-forest-strong">
          $
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14.5px] font-bold leading-tight">Finanzas</div>
          <div className="text-[11px] text-navy-muted truncate">{householdName}</div>
        </div>
        <ThemeToggle className="text-navy-muted hover:text-navy-ink hover:bg-white/[.09]" />
      </div>

      <nav className="flex flex-col gap-0.5 flex-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[11px] text-[13.6px] font-semibold transition-colors ${
                active
                  ? "bg-forest-tint text-forest"
                  : "text-navy-muted hover:bg-white/[.09] hover:text-navy-ink"
              }`}
            >
              <item.icon size={19} strokeWidth={1.7} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/[.09] pt-3.5 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold bg-forest-prev text-navy flex-none">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12.3px] font-semibold truncate">{userEmail}</div>
          <div className="text-[10.8px] text-navy-muted">Hogar compartido</div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="text-[11px] font-semibold text-navy-muted hover:text-navy-ink"
          >
            Salir
          </button>
        </form>
      </div>
    </aside>
  );
}
