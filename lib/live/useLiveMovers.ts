"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { binanceWs, type BinanceTicker } from "@/lib/exchanges/binance-ws";
import type { LiveStatus } from "@/components/status/LiveStatusChip";
import type { Listing } from "@/lib/data-sources/types";

const FLUSH_MS = 2000; // batch ticks so the list re-ranks calmly instead of every message
const GIVE_UP_MS = 10000; // no tick by then = feed blocked/unreachable → say "delayed"

/**
 * Live top gainers/losers. Takes the server's top-100 snapshot, subscribes
 * to Binance's per-coin miniTicker stream for each (no CoinGecko quota, one
 * shared WebSocket), and re-ranks from live price/24h-change. Coins Binance
 * doesn't list keep their snapshot values. If the socket never delivers
 * (blocked network), the snapshot stays and status says "delayed".
 */
export function useLiveMovers(markets: Listing[], count = 5) {
  const [live, setLive] = useState<Map<string, BinanceTicker>>(new Map());
  const [gaveUp, setGaveUp] = useState(false);
  const latest = useRef(new Map<string, BinanceTicker>());

  useEffect(() => {
    const symbols = Array.from(new Set(markets.map((m) => `${m.symbol}USDT`)));
    const unsubscribe = binanceWs.subscribeSymbols(symbols, "miniTicker", {
      ticker: (t) => latest.current.set(t.symbol, t),
    });
    const flush = setInterval(() => {
      if (latest.current.size) setLive(new Map(latest.current));
    }, FLUSH_MS);
    const giveUp = setTimeout(() => setGaveUp(true), GIVE_UP_MS);
    return () => {
      unsubscribe();
      clearInterval(flush);
      clearTimeout(giveUp);
    };
  }, [markets]);

  const { gainers, losers } = useMemo(() => {
    const merged = markets.map((m) => {
      const t = live.get(`${m.symbol}USDT`);
      if (!t) return m;
      // Guard against a ticker symbol that means a different asset on
      // Binance than on CoinGecko: a >2x gap vs the snapshot can't be real
      // drift in a 15-minute window, so ignore it.
      if (m.priceUsd && (t.price > m.priceUsd * 2 || t.price < m.priceUsd / 2)) return m;
      return { ...m, priceUsd: t.price, change24hPct: t.changePct24h };
    });
    const withChange = merged.filter((m) => m.change24hPct !== null);
    return {
      gainers: [...withChange].sort((a, b) => (b.change24hPct ?? 0) - (a.change24hPct ?? 0)).slice(0, count),
      losers: [...withChange].sort((a, b) => (a.change24hPct ?? 0) - (b.change24hPct ?? 0)).slice(0, count),
    };
  }, [markets, live, count]);

  const status: LiveStatus = live.size > 0 ? "live" : gaveUp ? "delayed" : "stale";
  return { gainers, losers, status };
}
