"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Newspaper, Sparkles } from "lucide-react";
import { OPEN_ASK_EVENT } from "@/components/ask/AskLauncher";
import { Logo } from "./Logo";
import { SiteSearch } from "./SiteSearch";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NAV_ITEMS, isNavActive } from "@/lib/nav/nav-items";

/** One translucent bar for every screen size. On desktop it carries the
 * navigation as plain text links (the active one is simply darker — no
 * pills, no underline); on mobile the tab bar at the bottom takes over and
 * this bar keeps just the logo and utilities. */
export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="glass sticky top-0 z-40 border-b border-line pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 w-full max-w-[1120px] items-center gap-6 px-5 sm:px-8">
        <Logo />

        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-[14px] font-medium tracking-[-0.01em] transition-colors ${
                  active ? "text-ink-50" : "text-ink-400 hover:text-ink-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden w-[220px] md:block">
            <SiteSearch />
          </div>
          <Link
            href="/news"
            className="press flex h-11 w-11 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-hover hover:text-ink-50 lg:hidden"
            aria-label="News"
          >
            <Newspaper className="h-[19px] w-[19px]" strokeWidth={1.75} />
          </Link>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent(OPEN_ASK_EVENT))}
            className="press flex h-11 w-11 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-hover hover:text-ink-50 lg:hidden"
            aria-label="Ask Nexus, the AI assistant"
          >
            <Sparkles className="h-[19px] w-[19px]" strokeWidth={1.75} />
          </button>
          <Link
            href="/alerts"
            className="press flex h-11 w-11 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-hover hover:text-ink-50 lg:hidden"
            aria-label="Alerts"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
