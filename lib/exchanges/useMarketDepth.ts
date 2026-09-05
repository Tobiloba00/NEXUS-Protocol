"use client";

import { useEffect, useState } from "react";
import { binanceWs, type BinanceDepth } from "./binance-ws";

/**
 * Order-book depth — Binance only for now. Bybit's public order-book topic
 * pushes snapshot + delta messages that need local reconciliation (merging
 * price-level updates into a maintained book); Binance's depth20@100ms
 * stream is self-contained (a full top-20 snapshot every push), which is
 * far less code and far less likely to silently drift out of sync. If a
 * visitor's Binance connection is blocked, this section degrades to
 * "unavailable" rather than attempting a from-scratch Bybit book-merge
 * implementation under time pressure.
 */
export function useMarketDepth(symbol: string) {
  const [depth, setDepth] = useState<BinanceDepth | null>(null);

  useEffect(() => {
    return binanceWs.subscribe(symbol, ["depth20@100ms"], { depth: setDepth });
  }, [symbol]);

  return depth;
}
