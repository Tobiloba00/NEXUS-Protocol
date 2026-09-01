"use client";

import { useBinanceTicker } from "@/lib/exchanges/useBinanceTicker";
import { LiveStatusChip, type LiveStatus } from "@/components/status/LiveStatusChip";

/** "connecting" (no message received yet at all) maps to "mock" — the chip's
 * "mock" state means "never reached live", which is exactly true until the
 * first real tick arrives; "stale" is reserved for "was live, dropped". */
function toChipStatus(wsStatus: "live" | "stale" | "connecting", hasTicker: boolean): LiveStatus {
  if (wsStatus === "live" && hasTicker) return "live";
  if (wsStatus === "stale" && hasTicker) return "stale";
  return "mock";
}

export function LiveTicker({
  symbol,
  base,
  quote,
  seedPrice,
}: {
  symbol: string;
  base: string;
  quote: string;
  seedPrice?: number | null;
}) {
  const { ticker, status } = useBinanceTicker(symbol);
  const price = ticker?.price ?? seedPrice ?? null;
  const changePct = ticker?.changePct24h;

  return (
    <div className="flex items-center gap-3">
      <span className="text-3xl font-semibold tabular-nums">
        {price !== null
          ? price.toLocaleString(undefined, { maximumFractionDigits: price < 1 ? 6 : 2 })
          : "—"}
        <span className="ml-1 text-base font-normal text-ink-400">{quote}</span>
      </span>
      {changePct !== undefined && (
        <span className={`text-sm font-medium ${changePct >= 0 ? "text-pos" : "text-neg"}`}>
          {changePct >= 0 ? "+" : ""}
          {changePct.toFixed(2)}%
        </span>
      )}
      <LiveStatusChip status={toChipStatus(status, ticker !== null)} source={`Binance ${base}/${quote}`} />
    </div>
  );
}
