/**
 * Tri-state live-data indicator, ported from legacy/index.html:3339-3364
 * (MarketDataChip). Same rule: only ever drops to "stale" if the feed was
 * previously live, otherwise "mock" — never show a shorter path than what
 * actually happened. Reused across every module (prices, listings, NFTs,
 * predictions).
 *
 * Visually it's just a dot and a caption — no border, no pill — so it reads
 * as a footnote, not as another control competing for attention.
 */

// "delayed" = the live feed never connected (blocked network, source down),
// so the page is showing the server's last cached snapshot. Said plainly
// instead of leaving a "Reconnecting…" label spinning forever.
export type LiveStatus = "live" | "stale" | "mock" | "delayed";

export function LiveStatusChip({ status, source }: { status: LiveStatus; source?: string }) {
  const label =
    status === "live"
      ? `Live${source ? ` · ${source}` : ""}`
      : status === "stale"
        ? "Connecting…"
        : status === "delayed"
          ? "Delayed · cached snapshot"
          : "Sample data";

  const dotClass =
    status === "live"
      ? "bg-pos live-dot"
      : status === "stale"
        ? "bg-ink-400 animate-pulse"
        : status === "delayed"
          ? "bg-warn"
          : "bg-ink-500";

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] tracking-[-0.005em] text-ink-400">
      <span className={`h-[7px] w-[7px] rounded-full ${dotClass}`} aria-hidden />
      {label}
    </span>
  );
}
