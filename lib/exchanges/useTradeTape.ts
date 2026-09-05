"use client";

import { useEffect, useRef, useState } from "react";
import { binanceWs, type BinanceTrade } from "./binance-ws";
import { bybitWs, type BybitTrade } from "./bybit-ws";

const BYBIT_FALLBACK_AFTER_MS = 6000;
const MAX_TRADES = 30;

export type TapeTrade = { price: number; qty: number; time: number; side: "buy" | "sell" };

/** Same two-tier Binance->Bybit fallback as useLiveTicker, scoped to trade
 * prints instead of the 24h ticker. Keeps the most recent MAX_TRADES,
 * newest first. */
export function useTradeTape(symbol: string) {
  const [trades, setTrades] = useState<TapeTrade[]>([]);
  const activeSourceRef = useRef<"Binance" | "Bybit" | null>(null);

  useEffect(() => {
    const pushTrade = (t: TapeTrade) => setTrades((prev) => [t, ...prev].slice(0, MAX_TRADES));

    const applyBinance = (t: BinanceTrade) => {
      if (activeSourceRef.current === "Bybit") return;
      activeSourceRef.current = "Binance";
      pushTrade(t);
    };
    const applyBybit = (t: BybitTrade) => {
      if (activeSourceRef.current === "Binance") return;
      activeSourceRef.current = "Bybit";
      pushTrade(t);
    };

    const unsubscribeBinance = binanceWs.subscribe(symbol, ["trade"], { trade: applyBinance });

    const unsubscribeBybitRef: { current: null | (() => void) } = { current: null };
    const fallbackTimer = setTimeout(() => {
      if (activeSourceRef.current) return;
      unsubscribeBybitRef.current = bybitWs.subscribe(symbol, ["publicTrade"], { trade: applyBybit });
    }, BYBIT_FALLBACK_AFTER_MS);

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribeBinance();
      unsubscribeBybitRef.current?.();
    };
  }, [symbol]);

  return trades;
}
