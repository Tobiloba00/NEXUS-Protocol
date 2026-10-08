"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NexusOrb } from "@/components/ui/NexusOrb";
import { OPEN_ASK_EVENT } from "@/components/ask/AskLauncher";
import { DOCK_LEFT, DOCK_RIGHT, isNavActive, type NavItem } from "@/lib/nav/nav-items";

function Tab({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`press flex min-w-0 flex-1 flex-col items-center gap-[3px] py-1 text-[10.5px] font-medium tracking-[0.005em] ${
        active ? "text-accent" : "text-ink-400"
      }`}
    >
      <span
        className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-300 ${
          active ? "bg-accent-soft" : ""
        }`}
      >
        <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.1 : 1.7} />
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

/**
 * Phone & tablet navigation: a floating glass dock with the AI orb raised in
 * the middle (it opens the assistant sheet). It floats clear of the screen
 * edges and respects the home-indicator safe area. Hidden from `lg` up, where
 * the top bar carries the links and the orb floats bottom-right.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(10px+env(safe-area-inset-bottom))] lg:hidden"
    >
      <div className="glass pointer-events-auto relative flex w-full max-w-[460px] items-end rounded-[30px] border border-line px-1.5 pb-1.5 pt-1.5 shadow-[var(--shadow-lg)]">
        {DOCK_LEFT.map((item) => (
          <Tab key={item.href} item={item} active={isNavActive(pathname, item.href)} />
        ))}

        <button
          onClick={() => window.dispatchEvent(new CustomEvent(OPEN_ASK_EVENT))}
          aria-label="Ask Nexus, the AI assistant"
          className="press relative z-10 -mt-9 flex w-[84px] shrink-0 flex-col items-center gap-[3px] pb-1 text-[10.5px] font-semibold text-ink-100"
        >
          <span className="rounded-full bg-[var(--bg)] p-[5px] shadow-[0_6px_18px_-4px_rgba(0,0,0,0.35)]">
            <NexusOrb size={56} />
          </span>
          Ask
        </button>

        {DOCK_RIGHT.map((item) => (
          <Tab key={item.href} item={item} active={isNavActive(pathname, item.href)} />
        ))}
      </div>
    </nav>
  );
}
