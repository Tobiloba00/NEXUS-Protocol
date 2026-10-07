"use client";

import { useState } from "react";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { LiveStatusChip } from "@/components/status/LiveStatusChip";
import { usePriceFlash } from "@/lib/exchanges/usePriceFlash";
import { useLiveMovers } from "@/lib/live/useLiveMovers";
import type { Listing } from "@/lib/data-sources/types";

const FLASH_CLASS: Record<"up" | "down", string> = {
  up: "bg-pos-soft",
  down: "bg-neg-soft",
};

function MoverRow({ row }: { row: Listing }) {
  const flash = usePriceFlash(row.priceUsd);
  return (
    <li className="flex items-center gap-2.5">
      <TokenIcon src={row.image} alt={row.symbol} size={28} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{row.symbol}</div>
      </div>
      <div className="text-right">
        <div
          className={`rounded px-1 text-sm tabular-nums transition-colors duration-300 ${flash ? FLASH_CLASS[flash] : ""}`}
        >
          ${row.priceUsd !== null ? (row.priceUsd < 1 ? row.priceUsd.toPrecision(3) : row.priceUsd.toFixed(2)) : "—"}
        </div>
        {row.change24hPct !== null && (
          <div className={`text-xs tabular-nums ${row.change24hPct >= 0 ? "text-pos" : "text-neg"}`}>
            {row.change24hPct >= 0 ? "+" : ""}
            {row.change24hPct.toFixed(2)}%
          </div>
        )}
      </div>
    </li>
  );
}

/** `markets` is the server's top-100 snapshot; ranking and prices are then
 * kept live in the browser (see lib/live/useLiveMovers.ts). */
export function TopMovers({ markets }: { markets: Listing[] }) {
  const [tab, setTab] = useState<"gainers" | "losers">("gainers");
  const { gainers, losers, status } = useLiveMovers(markets);
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
          <MoverRow key={r.id} row={r} />
        ))}
      </ul>
      <div className="mt-3">
        <LiveStatusChip status={status} source="Binance" />
      </div>
    </div>
  );
}
