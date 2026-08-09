"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { bottomNavItems } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-navy z-40 flex items-center justify-around pb-[env(safe-area-inset-bottom)]">
      {bottomNavItems.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
              active ? "text-forest" : "text-navy-muted"
            }`}
          >
            <item.icon size={18} strokeWidth={1.7} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
