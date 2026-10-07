"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { binanceWs } from "@/lib/exchanges/binance-ws";
import { useChartTheme } from "@/lib/client/useChartTheme";

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
 * whole chart component per tick would be needlessly expensive. Colors come
 * from the design tokens and re-apply when the theme changes.
 */
export function PriceChart({ symbol, seed }: { symbol: string; seed: SeedCandle[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const theme = useChartTheme();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, fontSize: 12, attributionLogo: false },
      localization: {
        priceFormatter: (p: number) =>
          p.toLocaleString("en-US", { maximumFractionDigits: p >= 1000 ? 0 : p >= 1 ? 2 : 6 }),
      },
      grid: { vertLines: { visible: false } },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.08, bottom: 0.08 } },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
    });
    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, { borderVisible: false });
    seriesRef.current = series;
    if (seed.length) {
      series.setData(seed);
      chart.timeScale().fitContent(); // otherwise candles bunch up on the right edge
    }

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
      seriesRef.current = null;
    };
    // seed only primes initial data on mount; re-seeding on every reference
    // change would tear down and rebuild the whole chart for no visual benefit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  useEffect(() => {
    chartRef.current?.applyOptions({
      layout: { textColor: theme.text },
      grid: { horzLines: { color: theme.grid } },
    });
    seriesRef.current?.applyOptions({
      upColor: theme.up,
      downColor: theme.down,
      wickUpColor: theme.up,
      wickDownColor: theme.down,
    });
  }, [theme]);

  return <div ref={containerRef} className="h-[360px] w-full sm:h-[460px]" />;
}
