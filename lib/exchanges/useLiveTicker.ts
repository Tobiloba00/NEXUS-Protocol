"use client";

import { useEffect, useRef, useState } from "react";
import { binanceWs, type BinanceTicker } from "./binance-ws";
import { bybitWs, type BybitTicker } from "./bybit-ws";

const BYBIT_FALLBACK_AFTER_MS = 6000; // if Binance hasn't delivered a tick by then, also try Bybit
const CACHE_FALLBACK_AFTER_MS = 10000; // if NEITHER exchange has spoken by then, fall back to our own cache
const CACHE_POLL_INTERVAL_MS = 15000;

export type LiveTickerState = {
  price: number | null;
  changePct24h: number | null;
  status: "live" | "stale" | "connecting";
  source: "Binance" | "Bybit" | "NEXUS cache" | null;
};

/**
 * Three-tier fallback, not just Binance: Binance's WebSocket is geo-blocked
 * in several countries (why Binance.US exists as a separate product), so
 * Bybit is tried next after a short grace period. But if a visitor's
 * network blocks *both* exchange WebSocket domains outright (plausible —
 * some networks/regions filter crypto-exchange domains broadly, not just
 * Binance specifically), there was previously nothing left to fall back to
 * and the ticker sat on "Sample data" forever. Confirmed as a real failure
 * during this build, not a hypothetical — this tier fixes it: poll our own
 * /api/price/[symbol] route (reads the price the poll pipeline already
 * cached in Supabase) every 15s. It's never blocked the same way a raw
 * exchange WS connection would be, since it's just a normal HTTPS request
 * to our own domain, and it costs nothing extra upstream regardless of how
 * many visitors fall back to it (Supabase read, not a CoinGecko call).
 *
 * All setState calls happen inside async callbacks (WS messages, fetch
 * responses), not synchronously in an effect body — satisfies
 * react-hooks/set-state-in-effect throughout.
 */
export function useLiveTicker(symbol: string) {
  const [state, setState] = useState<LiveTickerState>({
    price: null,
    changePct24h: null,
    status: "connecting",
    source: null,
  });

  // Tracks which source is currently "active" so a late tick from a
  // lower-priority tier can't clobber a display already running on a
  // higher-priority one, and vice versa before any tier has spoken.
  const activeSourceRef = useRef<LiveTickerState["source"]>(null);

  // Callers render this hook's consumer with `key={symbol}` (see
  // LiveTicker's call sites) so a symbol change remounts fresh state
  // instead of needing a manual reset here.
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
    const bybitTimer = setTimeout(() => {
      if (activeSourceRef.current) return; // something already came through
      unsubscribeBybitRef.current = bybitWs.subscribe(symbol, ["tickers"], { ticker: applyBybit });
    }, BYBIT_FALLBACK_AFTER_MS);

    // Last resort: neither exchange WS spoke within 10s — poll our own
    // cache instead of leaving the ticker stuck forever.
    let cachePollTimer: ReturnType<typeof setInterval> | null = null;
    const cacheStartTimer = setTimeout(() => {
      if (activeSourceRef.current) return; // Binance or Bybit already won

      const pollCache = () => {
        if (activeSourceRef.current && activeSourceRef.current !== "NEXUS cache") return; // an exchange caught up
        fetch(`/api/price/${symbol}`)
          .then((res) => res.json())
          .then((json) => {
            if (activeSourceRef.current && activeSourceRef.current !== "NEXUS cache") return;
            if (!json.ok || json.priceUsd === null) return;
            activeSourceRef.current = "NEXUS cache";
            setState({
              price: json.priceUsd,
              changePct24h: json.change24hPct,
              status: "live",
              source: "NEXUS cache",
            });
          })
          .catch(() => {
            // leave whatever state is already showing rather than flip to an error
          });
      };
      pollCache();
      cachePollTimer = setInterval(pollCache, CACHE_POLL_INTERVAL_MS);
    }, CACHE_FALLBACK_AFTER_MS);

    return () => {
      clearTimeout(bybitTimer);
      clearTimeout(cacheStartTimer);
      if (cachePollTimer) clearInterval(cachePollTimer);
      unsubscribeBinance();
      unsubscribeBinanceStatus();
      unsubscribeBybitRef.current?.();
    };
  }, [symbol]);

  return state;
}
