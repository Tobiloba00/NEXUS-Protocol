"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_TABS, isNavActive } from "@/lib/nav/nav-items";

/** iOS-style tab bar: translucent, five slots, icon over a tiny label. */
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-md">
        {MOBILE_TABS.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`press flex flex-1 flex-col items-center gap-[3px] pb-1.5 pt-2 text-[10px] font-medium tracking-[0.01em] ${
                active ? "text-accent" : "text-ink-400"
              }`}
            >
              <Icon className="h-[23px] w-[23px]" strokeWidth={active ? 2.1 : 1.6} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
