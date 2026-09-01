"use client";

import { useEffect, useState } from "react";
import { binanceWs, type BinanceTicker } from "./binance-ws";

/**
 * setTicker/setStatus below are called from the WS manager's async
 * message/status callbacks (a genuine external event firing later), not
 * synchronously in the effect body — the pattern react-hooks/set-state-in-
 * effect explicitly allows ("subscribe for updates ... calling setState in
 * a callback when external state changes"). Contrast with
 * useLocalStorageValue, which reads a value that's already available
 * synchronously and so uses useSyncExternalStore instead.
 *
 * If a symbol can change across the lifetime of one component instance
 * (e.g. a pair switcher), render the consumer with `key={symbol}` so React
 * remounts this hook's state instead of leaving the previous pair's price
 * on screen until the first new tick arrives.
 */
export function useBinanceTicker(symbol: string) {
  const [ticker, setTicker] = useState<BinanceTicker | null>(null);
  const [status, setStatus] = useState<"live" | "stale" | "connecting">("connecting");

  useEffect(() => {
    const unsubscribeTicker = binanceWs.subscribe(symbol, ["ticker"], { ticker: setTicker });
    const unsubscribeStatus = binanceWs.onStatusChange(setStatus);
    return () => {
      unsubscribeTicker();
      unsubscribeStatus();
    };
  }, [symbol]);

  return { ticker, status };
}
