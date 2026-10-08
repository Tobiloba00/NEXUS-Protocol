"use client";

import { useEffect, useRef, useState } from "react";
import { binanceWs, type BinanceTicker } from "@/lib/exchanges/binance-ws";

/**
 * Live price + 24h change for MANY symbols over the one shared Binance
 * WebSocket (a miniTicker stream per symbol, a single connection). Updates are
 * batched every 2s so a 100-row list re-renders calmly instead of on every tick.
 * Symbols Binance doesn't list simply never appear in the map.
 */
export function useLiveTickers(symbols: string[]) {
  const [live, setLive] = useState<Map<string, BinanceTicker>>(new Map());
  const latest = useRef(new Map<string, BinanceTicker>());
  const key = symbols.join(",");

  useEffect(() => {
    const unsubscribe = binanceWs.subscribeSymbols(key ? key.split(",") : [], "miniTicker", {
      ticker: (t) => latest.current.set(t.symbol, t),
    });
    const flush = setInterval(() => {
      if (latest.current.size) setLive(new Map(latest.current));
    }, 2000);
    return () => {
      unsubscribe();
      clearInterval(flush);
    };
  }, [key]);

  return live;
}
