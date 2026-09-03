import Link from "next/link";
import { Sparkle } from "lucide-react";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-white shadow-[0_0_16px_-2px_var(--accent)]">
        <Sparkle className="h-4 w-4" fill="currentColor" strokeWidth={0} />
      </span>
      <span className="flex items-baseline gap-1.5 leading-none">
        <span className="font-semibold tracking-tight">NEXUS</span>
        <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-ink-400">Protocol</span>
      </span>
    </Link>
  );
}
