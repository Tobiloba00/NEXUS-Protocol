"use client";

import dynamic from "next/dynamic";

export const PriceChartLazy = dynamic(() => import("./PriceChart").then((m) => m.PriceChart), {
  ssr: false,
  loading: () => <div className="h-[360px] animate-pulse rounded-3xl bg-surface-2/60 sm:h-[460px]" aria-label="Loading chart" />,
});
