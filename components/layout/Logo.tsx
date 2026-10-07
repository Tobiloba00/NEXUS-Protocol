import Link from "next/link";

/** A plain monogram: ink-colored squircle with a hand-set "N". No gradient,
 * no glow — it inverts with the theme instead. */
export function Logo() {
  return (
    <Link href="/" className="press flex items-center gap-2.5" aria-label="NEXUS home">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-ink-50 text-bg">
        <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6.5 18.5V5.5l11 13v-13" />
        </svg>
      </span>
      <span className="text-[17px] font-semibold tracking-[-0.025em]">Nexus</span>
    </Link>
  );
}
