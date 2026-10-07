"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaSeries,
  ColorType,
  CrosshairMode,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { Segmented } from "@/components/ui/Segmented";
import { useChartTheme, withAlpha } from "@/lib/client/useChartTheme";
import type { SeedCandle } from "./PriceChart";

const RANGES = [
  { value: "1d", label: "1D" },
  { value: "1w", label: "1W" },
  { value: "1m", label: "1M" },
  { value: "1y", label: "1Y" },
] as const;
type Range = (typeof RANGES)[number]["value"];

type Point = { time: UTCTimestamp; value: number };

const toPoints = (candles: SeedCandle[]): Point[] =>
  candles.map((c) => ({ time: c.time, value: c.close }));

/** Overview chart: a single smooth area line (iOS Stocks style) rather than
 * candlesticks — the headline number is the focus here; /trade/[pair] has the
 * full candlestick view. Line color follows direction over the shown range. */
export function HeroChart({ pairSlug, seed }: { pairSlug: string; seed: SeedCandle[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const theme = useChartTheme();
  const [range, setRange] = useState<Range>("1d");
  const [points, setPoints] = useState<Point[]>(() => toPoints(seed));

  const rising = useMemo(
    () => points.length < 2 || points[points.length - 1].value >= points[0].value,
    [points]
  );
  const lineColor = rising ? theme.up : theme.down;

  // Create once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const chart = createChart(container, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, fontSize: 12, attributionLogo: false },
      localization: {
        // Whole dollars on a big axis (83,200), cents only when it matters.
        priceFormatter: (p: number) =>
          p.toLocaleString("en-US", { maximumFractionDigits: p >= 1000 ? 0 : p >= 1 ? 2 : 6 }),
      },
      grid: { vertLines: { visible: false }, horzLines: { visible: true } },
      crosshair: { mode: CrosshairMode.Magnet, vertLine: { labelVisible: false }, horzLine: { visible: false, labelVisible: false } },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.12, bottom: 0.08 } },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false, fixLeftEdge: true, fixRightEdge: true },
      handleScale: false,
      handleScroll: false,
    });
    chartRef.current = chart;
    seriesRef.current = chart.addSeries(AreaSeries, {
      lineWidth: 2,
      lineType: 2, // curved
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerRadius: 5,
    });
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Colors follow theme + direction.
  useEffect(() => {
    chartRef.current?.applyOptions({
      layout: { textColor: theme.text },
      grid: { horzLines: { color: theme.grid } },
      crosshair: { vertLine: { color: theme.text, width: 1, style: 3 } },
    });
    seriesRef.current?.applyOptions({
      lineColor,
      topColor: withAlpha(lineColor, 0.2),
      bottomColor: withAlpha(lineColor, 0),
      crosshairMarkerBackgroundColor: lineColor,
      crosshairMarkerBorderColor: theme.surface,
    });
  }, [theme, lineColor]);

  // Data follows the selected range.
  useEffect(() => {
    seriesRef.current?.setData(points);
    chartRef.current?.timeScale().fitContent();
  }, [points]);

  function pick(next: Range) {
    setRange(next);
    if (next === "1d") {
      setPoints(toPoints(seed));
      return;
    }
    fetch(`/api/ohlc/${pairSlug}?range=${next}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok || !json.candles?.length) return;
        setPoints(
          json.candles.map(([time, , , , close]: [number, number, number, number, number]) => ({
            time: Math.floor(time / 1000) as UTCTimestamp,
            value: close,
          }))
        );
      })
      .catch(() => {
        // keep the previous range on screen if the refetch fails
      });
  }

  return (
    <div className="flex flex-col gap-3">
      <div ref={containerRef} className="h-[260px] w-full sm:h-[340px]" />
      <Segmented options={[...RANGES]} value={range} onChange={pick} className="self-center" ariaLabel="Chart range" />
    </div>
  );
}
