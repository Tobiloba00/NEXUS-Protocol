"use client";

import { useEffect, useRef } from "react";
import { CandlestickSeries, createChart, type IChartApi, type UTCTimestamp } from "lightweight-charts";
import { binanceWs } from "@/lib/exchanges/binance-ws";

export type SeedCandle = {
  time: UTCTimestamp; // seconds
  open: number;
  high: number;
  low: number;
  close: number;
};

/**
 * Candlestick chart seeded with server-fetched CoinGecko OHLC (so there's
 * real content on first paint / for crawlers — see the /trade/[pair] page)
 * and live-updated by appending Binance kline ticks on top. Chart updates
 * are imperative (series.update()), not React state, since re-rendering a
 * whole chart component per tick would be needlessly expensive — this is
 * the same reason charting libraries generally expose an imperative API.
 */
export function PriceChart({ symbol, seed }: { symbol: string; seed: SeedCandle[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: "#a3a3b0",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      timeScale: { timeVisible: true, secondsVisible: false },
    });
    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    if (seed.length) series.setData(seed);

    const unsubscribeKline = binanceWs.subscribe(symbol, ["kline_1m"], {
      kline: (k) => {
        series.update({
          time: Math.floor(k.openTime / 1000) as UTCTimestamp,
          open: k.open,
          high: k.high,
          low: k.low,
          close: k.close,
        });
      },
    });

    return () => {
      unsubscribeKline();
      chart.remove();
      chartRef.current = null;
    };
    // seed is only used to prime initial data on mount, not tracked as a
    // live dependency — re-seeding on every reference change would tear
    // down and rebuild the whole chart for no visual benefit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  return <div ref={containerRef} className="h-[420px] w-full" />;
}
