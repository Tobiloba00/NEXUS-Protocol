"use client";

import { useLiveTicker } from "@/lib/exchanges/useLiveTicker";
import { LiveStatusChip, type LiveStatus } from "@/components/status/LiveStatusChip";

/** "connecting" (no message received yet, from either exchange) maps to
 * "mock" — the chip's "mock" state means "never reached live", exactly
 * true until the first real tick arrives from either source. */
function toChipStatus(wsStatus: "live" | "stale" | "connecting"): LiveStatus {
  if (wsStatus === "live") return "live";
  if (wsStatus === "stale") return "stale";
  return "mock";
}

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
    <div className="flex items-center gap-3">
      <span className="text-3xl font-semibold tabular-nums">
        {price !== null
          ? price.toLocaleString(undefined, { maximumFractionDigits: price < 1 ? 6 : 2 })
          : "—"}
        <span className="ml-1 text-base font-normal text-ink-400">{quote}</span>
      </span>
      {changePct24h !== null && (
        <span className={`text-sm font-medium ${changePct24h >= 0 ? "text-pos" : "text-neg"}`}>
          {changePct24h >= 0 ? "+" : ""}
          {changePct24h.toFixed(2)}%
        </span>
      )}
      <LiveStatusChip status={toChipStatus(status)} source={source ?? undefined} />
    </div>
  );
}
