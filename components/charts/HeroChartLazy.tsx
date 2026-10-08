"use client";

import dynamic from "next/dynamic";

/** The chart library is ~150 KB; load it after first paint instead of before it. */
export const HeroChartLazy = dynamic(() => import("./HeroChart").then((m) => m.HeroChart), {
  ssr: false,
  loading: () => <div className="h-[260px] animate-pulse rounded-3xl bg-surface-2/60 sm:h-[340px]" aria-label="Loading chart" />,
});
