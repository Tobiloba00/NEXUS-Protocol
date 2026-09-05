"use client";

import { useLiveTicker } from "@/lib/exchanges/useLiveTicker";
import { usePriceFlash } from "@/lib/exchanges/usePriceFlash";

const FLASH_CLASS: Record<"up" | "down", string> = {
  up: "bg-pos-soft text-pos",
  down: "bg-neg-soft text-neg",
};

/** Compact live price for list rows (homepage Market Summary) where the
 * full LiveTicker's 3xl hero styling doesn't fit — same live data + flash
 * feedback, smaller footprint. Was previously a static CoinGecko snapshot
 * that only changed on the page's revalidation window (up to 2 min), which
 * read as "not live at all" next to the genuinely-ticking /markets page. */
export function CompactPrice({ symbol, seedPrice }: { symbol: string; seedPrice: number | null }) {
  const { price: livePrice } = useLiveTicker(symbol);
  const price = livePrice ?? seedPrice;
  const flash = usePriceFlash(price);

  return (
    <span
      className={`rounded px-1 text-sm tabular-nums transition-colors duration-300 ${
        flash ? FLASH_CLASS[flash] : "text-ink-300"
      }`}
    >
      {price !== null ? `$${price.toLocaleString(undefined, { maximumFractionDigits: price < 1 ? 6 : 2 })}` : "—"}
    </span>
  );
}
