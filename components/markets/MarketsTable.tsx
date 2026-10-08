"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { ChangePill } from "@/components/ui/ChangePill";
import { Segmented } from "@/components/ui/Segmented";
import { Sparkline } from "@/components/ui/Sparkline";
import { LiveStatusChip } from "@/components/status/LiveStatusChip";
import { usePriceFlash } from "@/lib/exchanges/usePriceFlash";
import { useLiveTickers } from "@/lib/live/useLiveTickers";
import type { SlimCoin } from "@/lib/data/slim";

const PAGE = 50;

type Row = SlimCoin & { rank: number };

function price(p: number | null) {
  if (p === null) return "—";
  return `$${p.toLocaleString("en-US", { maximumFractionDigits: p < 1 ? 6 : 2 })}`;
}
function cap(n: number | null) {
  if (n === null) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString("en-US")}`;
}

// Mobile: name | trend | price+change.  Tablet+: rank | name | trend | price | 24h | 7d | market cap.
const GRID =
  "grid grid-cols-[minmax(0,1fr)_64px_112px] items-center gap-x-3 md:grid-cols-[28px_minmax(0,1fr)_88px_118px_82px_82px_104px] md:gap-x-4";

function CoinRow({ c }: { c: Row }) {
  const flash = usePriceFlash(c.priceUsd);
  return (
    <li className="list-row">
      <Link href={`/trade/${c.symbol.toLowerCase()}-usdt`} className={`list-row ${GRID} px-4 py-3`}>
        <span className="hidden text-[13px] tabular-nums text-ink-500 md:block">{c.rank}</span>
        <div className="flex min-w-0 items-center gap-3">
          <TokenIcon src={c.image} alt={c.symbol} size={36} />
          <div className="min-w-0">
            <div className="truncate text-[16px] font-semibold tracking-[-0.015em]">{c.symbol}</div>
            <div className="truncate text-[13px] text-ink-400">{c.name}</div>
          </div>
        </div>
        <Sparkline data={c.spark} width={64} height={28} className="md:w-[88px]" />
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-[16px] font-semibold tracking-[-0.02em] tabular-nums transition-colors duration-500 ${
              flash === "up" ? "text-pos" : flash === "down" ? "text-neg" : "text-ink-50"
            }`}
          >
            {price(c.priceUsd)}
          </span>
          <span className="md:hidden">
            <ChangePill pct={c.change24hPct} />
          </span>
        </div>
        <span className="hidden justify-end md:flex">
          <ChangePill pct={c.change24hPct} />
        </span>
        <span className="hidden justify-end md:flex">
          <ChangePill pct={c.change7dPct} digits={1} />
        </span>
        <span className="hidden text-right text-[14px] tabular-nums text-ink-300 md:block">{cap(c.marketCapUsd)}</span>
      </Link>
    </li>
  );
}

/**
 * The top 100 coins by market cap with 7-day trend lines and live prices. The
 * list is server-rendered from the cache (so it's in the HTML for search
 * engines), then prices and 24h moves tick live over one shared WebSocket.
 */
export function MarketsTable({ coins }: { coins: SlimCoin[] }) {
  const symbols = useMemo(() => coins.map((c) => `${c.symbol}USDT`), [coins]);
  const live = useLiveTickers(symbols);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"cap" | "gainers" | "losers">("cap");
  const [showAll, setShowAll] = useState(false);

  const rows = useMemo<Row[]>(() => {
    let list: Row[] = coins.map((c, i) => {
      const t = live.get(`${c.symbol}USDT`);
      // Ignore a ticker whose price is wildly off the snapshot: a symbol clash with a different asset.
      const ok = t && !(c.priceUsd && (t.price > c.priceUsd * 2 || t.price < c.priceUsd / 2));
      return { ...c, rank: i + 1, priceUsd: ok ? t.price : c.priceUsd, change24hPct: ok ? t.changePct24h : c.change24hPct };
    });
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((c) => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
    if (sort === "gainers") list = [...list].sort((a, b) => (b.change24hPct ?? -Infinity) - (a.change24hPct ?? -Infinity));
    if (sort === "losers") list = [...list].sort((a, b) => (a.change24hPct ?? Infinity) - (b.change24hPct ?? Infinity));
    return list;
  }, [coins, live, query, sort]);

  const shown = showAll || query ? rows : rows.slice(0, PAGE);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-ink-400" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 100 coins"
            aria-label="Search coins"
            className="h-11 w-full rounded-[12px] bg-[var(--seg-track)] pl-10 pr-3 text-[16px] tracking-[-0.01em] outline-none placeholder:text-ink-400 focus:ring-2 focus:ring-accent/40"
          />
        </label>
        <Segmented
          ariaLabel="Sort"
          value={sort}
          onChange={setSort}
          options={[
            { value: "cap", label: "Top" },
            { value: "gainers", label: "Gainers" },
            { value: "losers", label: "Losers" },
          ]}
        />
      </div>

      <div className={`hidden px-4 text-[12px] font-medium text-ink-400 md:grid ${GRID.replace("items-center", "")}`}>
        <span>#</span>
        <span>Coin</span>
        <span>7 days</span>
        <span className="text-right">Price</span>
        <span className="text-right">24h</span>
        <span className="text-right">7d</span>
        <span className="text-right">Market cap</span>
      </div>

      <ul className="group-card" style={{ "--sep-inset": "64px" } as React.CSSProperties}>
        {shown.map((c) => (
          <CoinRow key={c.id} c={c} />
        ))}
        {rows.length === 0 && <li className="px-4 py-12 text-center text-[15px] text-ink-400">No coins match “{query}”.</li>}
      </ul>

      {!showAll && !query && rows.length > PAGE && (
        <button onClick={() => setShowAll(true)} className="press h-[50px] rounded-[14px] bg-surface text-[15px] font-medium text-accent">
          Show all {rows.length} coins
        </button>
      )}
      <LiveStatusChip status={live.size ? "live" : "delayed"} source="Binance" />
    </div>
  );
}
