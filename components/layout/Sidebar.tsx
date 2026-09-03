"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Logo } from "./Logo";
import { NAV_GROUPS } from "@/lib/nav/nav-items";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

/** Persistent left nav — desktop only (see MobileNav for small screens).
 * The mockup's "Connect Wallet" card is replaced with a real, working
 * equivalent: this app has no wallet integration at all (dropped from
 * scope), so a wallet-connect button here would be exactly the kind of
 * looks-real-but-does-nothing control already fixed elsewhere. Telegram
 * alerts are the one thing in that visual slot that's actually real. */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="px-5 py-5">
        <Logo />
      </div>
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group, i) => (
          <div key={group.label ?? i} className="flex flex-col gap-0.5">
            {group.label && (
              <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-accent-soft text-accent" : "text-ink-300 hover:bg-hover hover:text-ink-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-line p-4">
        <Link
          href="/alerts"
          className="flex flex-col gap-1 rounded-xl2 border border-line bg-surface-2 p-3.5 hover:border-line-2"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <Bell className="h-4 w-4 text-accent" />
            Get price alerts
          </span>
          <span className="text-xs text-ink-400">Free via Telegram — set it up in seconds.</span>
        </Link>
      </div>
    </aside>
  );
}
