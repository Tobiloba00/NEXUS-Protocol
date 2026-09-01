"use client";

import { useEffect, useRef, useState } from "react";
import { binanceWs, type BinanceTicker } from "./binance-ws";
import { bybitWs, type BybitTicker } from "./bybit-ws";

const FALLBACK_AFTER_MS = 6000; // if Binance hasn't delivered a tick by then, also try Bybit

export type LiveTickerState = {
  price: number | null;
  changePct24h: number | null;
  status: "live" | "stale" | "connecting";
  source: "Binance" | "Bybit" | null;
};

/**
 * Real cross-exchange fallback, not just a Binance-only ticker: Binance's
 * WebSocket is geo-blocked in several countries/regions (the reason
 * Binance.US exists as a separate product), so a visitor there would see
 * "Sample data" forever with no way to recover — confirmed as a live bug
 * during this build, not a hypothetical. Bybit is subscribed in parallel
 * after a short grace period; whichever exchange actually delivers a tick
 * first "wins" for that symbol, and its name is surfaced in the status
 * chip so it's clear which feed is actually live for this visitor.
 *
 * All setState calls here happen inside the two WS managers' async
 * message/status callbacks, not synchronously in the effect body — same
 * pattern as useBinanceTicker, satisfies react-hooks/set-state-in-effect.
 */
export function useLiveTicker(symbol: string) {
  const [state, setState] = useState<LiveTickerState>({
    price: null,
    changePct24h: null,
    status: "connecting",
    source: null,
  });

  // Tracks which exchange is currently "active" for this render cycle so a
  // late Binance tick can't clobber a display already running on Bybit
  // once Bybit has taken over, and vice versa before either has spoken.
  const activeSourceRef = useRef<"Binance" | "Bybit" | null>(null);

  // Callers render this hook's consumer with `key={symbol}` (see
  // LiveTicker's call sites) so a symbol change remounts fresh state
  // instead of needing a manual reset here — resetting via setState
  // directly in the effect body would trip react-hooks/set-state-in-effect.
  useEffect(() => {
    const applyBinance = (t: BinanceTicker) => {
      if (activeSourceRef.current === "Bybit") return; // Bybit already took over
      activeSourceRef.current = "Binance";
      setState({ price: t.price, changePct24h: t.changePct24h, status: "live", source: "Binance" });
    };
    const applyBybit = (t: BybitTicker) => {
      if (activeSourceRef.current === "Binance") return; // Binance is already delivering fine
      activeSourceRef.current = "Bybit";
      setState({ price: t.price, changePct24h: t.changePct24h, status: "live", source: "Bybit" });
    };

    const unsubscribeBinance = binanceWs.subscribe(symbol, ["ticker"], { ticker: applyBinance });
    const unsubscribeBinanceStatus = binanceWs.onStatusChange((wsStatus) => {
      if (activeSourceRef.current !== "Binance") return;
      setState((prev) => ({ ...prev, status: wsStatus === "connecting" ? "connecting" : wsStatus }));
    });

    // Give Binance a head start (it's the primary source) before also
    // paying for a second connection — most visitors never need Bybit at all.
    const unsubscribeBybitRef: { current: null | (() => void) } = { current: null };
    const fallbackTimer = setTimeout(() => {
      if (activeSourceRef.current === "Binance") return; // Binance is working, no need for Bybit
      unsubscribeBybitRef.current = bybitWs.subscribe(symbol, applyBybit);
    }, FALLBACK_AFTER_MS);

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribeBinance();
      unsubscribeBinanceStatus();
      unsubscribeBybitRef.current?.();
    };
  }, [symbol]);

  return state;
}
