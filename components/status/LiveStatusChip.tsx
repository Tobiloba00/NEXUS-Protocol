/**
 * Tri-state live-data status chip, ported from legacy/index.html:3339-3364
 * (MarketDataChip) and the activity-feed StatusChip at 3192-3206. Same
 * three states, same rule: only ever drops to "stale" if the feed was
 * previously live, otherwise "mock" — never show a shorter path than what
 * actually happened. Reused across every module (prices, listings, NFTs,
 * predictions) rather than each one growing its own chip.
 */

// "delayed" = the live feed never connected (blocked network, source down),
// so the page is showing the server's last cached snapshot. Said plainly
// instead of leaving a "Reconnecting…" chip spinning forever.
export type LiveStatus = "live" | "stale" | "mock" | "delayed";

export function LiveStatusChip({ status, source }: { status: LiveStatus; source?: string }) {
  const label =
    status === "live"
      ? `Live${source ? ` · ${source}` : ""}`
      : status === "stale"
        ? "Reconnecting…"
        : status === "delayed"
          ? "Delayed · cached snapshot"
          : "Sample data";

  const dotClass =
    status === "live"
      ? "bg-pos"
      : status === "stale"
        ? "bg-neg animate-pulse"
        : status === "delayed"
          ? "bg-warn"
          : "bg-ink-500";

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs text-ink-300">
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden />
      {label}
    </span>
  );
}
