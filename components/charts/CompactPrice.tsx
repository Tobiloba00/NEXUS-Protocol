"use client";

import { useLiveTicker } from "@/lib/exchanges/useLiveTicker";
import { usePriceFlash } from "@/lib/exchanges/usePriceFlash";
import { ChangePill } from "@/components/ui/ChangePill";

/** Live price + 24h change for list rows, right-aligned: price on top, pill
 * beneath. The digits tint on each tick (same convention as the headline
 * ticker). Falls back to the server snapshot until the first tick arrives. */
export function CompactPrice({
  symbol,
  seedPrice,
  showChange = true,
}: {
  symbol: string;
  seedPrice: number | null;
  showChange?: boolean;
}) {
  const { price: livePrice, changePct24h } = useLiveTicker(symbol);
  const price = livePrice ?? seedPrice;
  const flash = usePriceFlash(price);

  return (
    <div className="flex flex-col items-end gap-1">
      <span
        className={`text-[16px] font-semibold tracking-[-0.02em] tabular-nums transition-colors duration-500 ${
          flash === "up" ? "text-pos" : flash === "down" ? "text-neg" : "text-ink-50"
        }`}
      >
        {price !== null ? price.toLocaleString("en-US", { maximumFractionDigits: price < 1 ? 6 : 2 }) : "—"}
      </span>
      {showChange && <ChangePill pct={changePct24h} />}
    </div>
  );
}
