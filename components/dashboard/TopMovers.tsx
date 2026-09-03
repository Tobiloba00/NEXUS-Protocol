"use client";

import { useState } from "react";
import { TokenIcon } from "@/components/ui/TokenIcon";
import type { Listing } from "@/lib/data-sources/types";

export function TopMovers({ gainers, losers }: { gainers: Listing[]; losers: Listing[] }) {
  const [tab, setTab] = useState<"gainers" | "losers">("gainers");
  const rows = tab === "gainers" ? gainers : losers;

  return (
    <div className="flex flex-col rounded-xl2 border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Top Movers</h3>
        <div className="flex gap-1 rounded-lg bg-surface-2 p-0.5">
          <button
            onClick={() => setTab("gainers")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              tab === "gainers" ? "bg-surface text-ink-50 shadow-[var(--shadow-card)]" : "text-ink-400"
            }`}
          >
            Top Gainers
          </button>
          <button
            onClick={() => setTab("losers")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              tab === "losers" ? "bg-surface text-ink-50 shadow-[var(--shadow-card)]" : "text-ink-400"
            }`}
          >
            Top Losers
          </button>
        </div>
      </div>
      <ul className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-2.5">
            <TokenIcon src={r.image} alt={r.symbol} size={28} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{r.symbol}</div>
            </div>
            <div className="text-right">
              <div className="text-sm tabular-nums">
                ${r.priceUsd !== null ? (r.priceUsd < 1 ? r.priceUsd.toPrecision(3) : r.priceUsd.toFixed(2)) : "—"}
              </div>
              {r.change24hPct !== null && (
                <div className={`text-xs tabular-nums ${r.change24hPct >= 0 ? "text-pos" : "text-neg"}`}>
                  {r.change24hPct >= 0 ? "+" : ""}
                  {r.change24hPct.toFixed(2)}%
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
