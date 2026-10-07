"use client";

import { useState } from "react";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { ChangePill } from "@/components/ui/ChangePill";
import { Segmented } from "@/components/ui/Segmented";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LiveStatusChip } from "@/components/status/LiveStatusChip";
import { usePriceFlash } from "@/lib/exchanges/usePriceFlash";
import { useLiveMovers } from "@/lib/live/useLiveMovers";
import type { Listing } from "@/lib/data-sources/types";

function formatPrice(p: number | null) {
  if (p === null) return "—";
  return p < 1 ? p.toPrecision(3) : p.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function MoverRow({ row }: { row: Listing }) {
  const flash = usePriceFlash(row.priceUsd);
  return (
    <li className="list-row flex items-center gap-3 px-4 py-3">
      <TokenIcon src={row.image} alt={row.symbol} size={36} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[16px] font-semibold tracking-[-0.015em]">{row.symbol}</div>
        <div className="truncate text-[13px] text-ink-400">{row.name}</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span
          className={`text-[16px] font-semibold tracking-[-0.02em] tabular-nums transition-colors duration-500 ${
            flash === "up" ? "text-pos" : flash === "down" ? "text-neg" : "text-ink-50"
          }`}
        >
          ${formatPrice(row.priceUsd)}
        </span>
        <ChangePill pct={row.change24hPct} />
      </div>
    </li>
  );
}

/** `markets` is the server's top-100 snapshot; ranking and prices are then
 * kept live in the browser (see lib/live/useLiveMovers.ts). */
export function TopMovers({ markets }: { markets: Listing[] }) {
  const [tab, setTab] = useState<"gainers" | "losers">("gainers");
  const { gainers, losers, status } = useLiveMovers(markets, 8);
  const rows = tab === "gainers" ? gainers : losers;

  return (
    <section>
      <SectionHeader
        title="Top Movers"
        trailing={
          <Segmented
            ariaLabel="Gainers or losers"
            value={tab}
            onChange={setTab}
            options={[
              { value: "gainers", label: "Gainers" },
              { value: "losers", label: "Losers" },
            ]}
          />
        }
      />
      <ul className="group-card" style={{ "--sep-inset": "64px" } as React.CSSProperties}>
        {rows.map((r) => (
          <MoverRow key={r.id} row={r} />
        ))}
      </ul>
      <div className="mt-3 px-1">
        <LiveStatusChip status={status} source="Binance" />
      </div>
    </section>
  );
}
