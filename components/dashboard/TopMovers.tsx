"use client";

import { useState } from "react";
import Link from "next/link";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { ChangePill } from "@/components/ui/ChangePill";
import { Segmented } from "@/components/ui/Segmented";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Sparkline } from "@/components/ui/Sparkline";
import { LiveStatusChip } from "@/components/status/LiveStatusChip";
import { usePriceFlash } from "@/lib/exchanges/usePriceFlash";
import { useLiveMovers } from "@/lib/live/useLiveMovers";
import type { SlimCoin } from "@/lib/data/slim";

function formatPrice(p: number | null) {
  if (p === null) return "—";
  return p < 1 ? p.toPrecision(3) : p.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
const tradeHref = (c: SlimCoin) => `/trade/${c.symbol.toLowerCase()}-usdt`;

function MoverRow({ row }: { row: SlimCoin }) {
  const flash = usePriceFlash(row.priceUsd);
  return (
    <li className="list-row">
      <Link href={tradeHref(row)} className="list-row flex items-center gap-3 px-4 py-3">
        <TokenIcon src={row.image} alt={row.symbol} size={36} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-semibold tracking-[-0.015em]">{row.symbol}</div>
          <div className="truncate text-[13px] text-ink-400">{row.name}</div>
        </div>
        <Sparkline data={row.spark} width={64} height={26} className="hidden sm:block" />
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
      </Link>
    </li>
  );
}

/** Phone card: swipeable, big numbers, a sparkline. */
function RailCard({ row }: { row: SlimCoin }) {
  return (
    <Link
      href={tradeHref(row)}
      className="press group-card flex w-[158px] shrink-0 snap-start flex-col gap-3 p-4"
    >
      <div className="flex items-center gap-2.5">
        <TokenIcon src={row.image} alt={row.symbol} size={32} />
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold tracking-[-0.015em]">{row.symbol}</div>
          <div className="truncate text-[12px] text-ink-400">{row.name}</div>
        </div>
      </div>
      <Sparkline data={row.spark} width={126} height={34} />
      <div className="flex flex-col items-start gap-1.5">
        <span className="text-[17px] font-semibold tracking-[-0.02em] tabular-nums">${formatPrice(row.priceUsd)}</span>
        <ChangePill pct={row.change24hPct} />
      </div>
    </Link>
  );
}

/** `markets` is the server's top-100 snapshot; ranking and prices are then
 * kept live in the browser (see lib/live/useLiveMovers.ts). Phones get a
 * swipeable card rail, tablets and desktops a list. */
export function TopMovers({ markets }: { markets: SlimCoin[] }) {
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

      <div className="no-scrollbar -mx-5 flex snap-x scroll-pl-5 gap-3 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:scroll-pl-8 sm:px-8 md:hidden">
        {rows.map((r) => (
          <RailCard key={r.id} row={r} />
        ))}
        {rows.length === 0 && <p className="px-1 py-6 text-[15px] text-ink-400">Nothing is moving that much right now.</p>}
      </div>

      <ul className="group-card hidden md:block" style={{ "--sep-inset": "64px" } as React.CSSProperties}>
        {rows.map((r) => (
          <MoverRow key={r.id} row={r} />
        ))}
        {rows.length === 0 && <li className="px-4 py-8 text-center text-[15px] text-ink-400">Nothing is moving that much right now.</li>}
      </ul>
      <div className="mt-3 px-1">
        <LiveStatusChip status={status} source="Binance" />
      </div>
    </section>
  );
}
