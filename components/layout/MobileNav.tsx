"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { MOBILE_TABS } from "@/lib/nav/nav-items";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function MobileTopBar() {
  return (
    <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
      <Logo />
      <div className="flex items-center gap-2">
        <Link
          href="/alerts"
          className="rounded-lg border border-line bg-surface-2 p-2 text-ink-300"
          title="Alerts"
        >
          <Bell className="h-4 w-4" />
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
      {MOBILE_TABS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] ${
              active ? "text-accent" : "text-ink-400"
            }`}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
