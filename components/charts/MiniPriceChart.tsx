"use client";

import { useEffect, useRef, useState } from "react";
import { CandlestickSeries, createChart, type IChartApi, type UTCTimestamp } from "lightweight-charts";
import type { SeedCandle } from "./PriceChart";

const RANGES = ["1d", "1w", "1m", "1y"] as const;
type Range = (typeof RANGES)[number];
const RANGE_LABEL: Record<Range, string> = { "1d": "1D", "1w": "1W", "1m": "1M", "1y": "1Y" };

/** Overview-dashboard chart: static per-range OHLC (no live WS overlay —
 * that's /trade/[pair]'s job), refetched client-side on tab click via
 * /api/ohlc/[pair]. */
export function MiniPriceChart({ pairSlug, seed }: { pairSlug: string; seed: SeedCandle[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ReturnType<IChartApi["addSeries"]> | null>(null);
  const [range, setRange] = useState<Range>("1d");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: { background: { color: "transparent" }, textColor: "#a3a3b0" },
      grid: { vertLines: { color: "rgba(255,255,255,0.05)" }, horzLines: { color: "rgba(255,255,255,0.05)" } },
      timeScale: { timeVisible: true, secondsVisible: false },
      rightPriceScale: { borderVisible: false },
    });
    chartRef.current = chart;
    seriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });
    if (seed.length) seriesRef.current.setData(seed);

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (range === "1d") {
      seriesRef.current?.setData(seed);
      return;
    }
    let cancelled = false;
    fetch(`/api/ohlc/${pairSlug}?range=${range}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled || !json.ok) return;
        const candles: SeedCandle[] = json.candles.map(
          ([time, open, high, low, close]: [number, number, number, number, number]) => ({
            time: Math.floor(time / 1000) as UTCTimestamp,
            open,
            high,
            low,
            close,
          })
        );
        seriesRef.current?.setData(candles);
      });
    return () => {
      cancelled = true;
    };
  }, [range, pairSlug, seed]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex justify-end gap-1 px-3 pt-2">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-md px-2 py-0.5 text-xs font-medium ${
              range === r ? "bg-accent-soft text-accent" : "text-ink-500 hover:text-ink-200"
            }`}
          >
            {RANGE_LABEL[r]}
          </button>
        ))}
      </div>
      <div ref={containerRef} className="min-h-[200px] flex-1" />
    </div>
  );
}
