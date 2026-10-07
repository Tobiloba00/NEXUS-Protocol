"use client";

import { useLiveTicker } from "@/lib/exchanges/useLiveTicker";
import { ChangePill } from "@/components/ui/ChangePill";
import { LiveStatusChip, type LiveStatus } from "@/components/status/LiveStatusChip";

/** "connecting" (no message received yet, from either exchange) maps to
 * "mock" — the chip's "mock" state means "never reached live", exactly
 * true until the first real tick arrives from either source. */
function toChipStatus(wsStatus: "live" | "stale" | "connecting"): LiveStatus {
  if (wsStatus === "live") return "live";
  if (wsStatus === "stale") return "stale";
  return "mock";
}

/** The page's headline number: big, tight-tracked, and calm. It updates in
 * place with no flashing — at this size the change itself is the signal; the
 * per-tick tint lives on the small numbers in lists (CompactPrice). */
export function LiveTicker({
  symbol,
  quote,
  seedPrice,
}: {
  symbol: string;
  base: string;
  quote: string;
  seedPrice?: number | null;
}) {
  const { price: livePrice, changePct24h, status, source } = useLiveTicker(symbol);
  const price = livePrice ?? seedPrice ?? null;

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={`text-[44px] font-bold leading-none tracking-[-0.045em] tabular-nums sm:text-[60px]`}
        >
          {price !== null
            ? price.toLocaleString("en-US", { maximumFractionDigits: price < 1 ? 6 : 2 })
            : "—"}
        </span>
        <span className="text-[17px] font-medium text-ink-400">{quote}</span>
        <ChangePill pct={changePct24h} className="self-center" />
      </div>
      <LiveStatusChip status={toChipStatus(status)} source={source ?? undefined} />
    </div>
  );
}
