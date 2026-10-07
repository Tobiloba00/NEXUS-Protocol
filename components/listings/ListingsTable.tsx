"use client";

import { useMemo, useState } from "react";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { ChangePill } from "@/components/ui/ChangePill";
import { Segmented } from "@/components/ui/Segmented";
import { ExternalLinkBadge } from "@/components/ui/ExternalLinkBadge";
import { LiveStatusChip } from "@/components/status/LiveStatusChip";
import { fetchNewTokenProfiles } from "@/lib/data-sources/dexscreener";
import { usePolled } from "@/lib/live/usePolled";
import type { Listing } from "@/lib/data-sources/types";

const REFRESH_MS = 20000;

async function fetchFreshListings() {
  const rows = await fetchNewTokenProfiles(30);
  if (!rows.length) throw new Error("no listings returned"); // keep previous rows on screen
  return rows;
}

function formatAge(pairCreatedAt: number | null) {
  if (!pairCreatedAt) return null;
  const ms = Date.now() - pairCreatedAt;
  const hours = ms / 3_600_000;
  if (hours < 1) return `${Math.max(1, Math.round(ms / 60_000))}m ago`;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function formatCompactUsd(n: number | null) {
  if (n === null) return null;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatPrice(p: number | null) {
  if (p === null) return "—";
  return `$${p < 1 ? p.toPrecision(3) : p.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

const CHAIN_LABEL: Record<string, string> = {
  solana: "Solana",
  ethereum: "Ethereum",
  bsc: "BNB Chain",
  base: "Base",
  arbitrum: "Arbitrum",
};
const chainName = (c: string | null) => (c ? (CHAIN_LABEL[c] ?? c) : "");

/** `listings` is the server's cached snapshot (first paint + SEO); the
 * browser then refreshes straight from DexScreener every 20s. */
export function ListingsTable({ listings: initial }: { listings: Listing[] }) {
  const { data: listings, status } = usePolled(fetchFreshListings, initial, REFRESH_MS);
  const [chain, setChain] = useState<string>("all");

  // Only the busiest few chains get a tab; the long tail stays under "All".
  const chains = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of listings) if (l.chain) counts.set(l.chain, (counts.get(l.chain) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([c]) => c);
  }, [listings]);

  const filtered = chain === "all" ? listings : listings.filter((l) => l.chain === chain);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="no-scrollbar max-w-full overflow-x-auto">
          <Segmented
            ariaLabel="Chain"
            value={chain}
            onChange={setChain}
            options={[{ value: "all", label: "All" }, ...chains.map((c) => ({ value: c, label: chainName(c) }))]}
          />
        </div>
        <LiveStatusChip status={status} source="DexScreener · every 20s" />
      </div>

      <ul className="group-card" style={{ "--sep-inset": "68px" } as React.CSSProperties}>
        {filtered.map((l) => {
          const age = formatAge(l.pairCreatedAt);
          const liquidity = formatCompactUsd(l.liquidityUsd);
          return (
            <li key={l.id} className="list-row flex items-center gap-3.5 px-4 py-3.5">
              <TokenIcon src={l.image} alt={l.symbol} size={40} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[16px] font-semibold tracking-[-0.015em]">{l.symbol}</div>
                <div className="truncate text-[13px] text-ink-400" suppressHydrationWarning>
                  {[l.name, chainName(l.chain), age].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="hidden w-[88px] text-right sm:block">
                {liquidity && (
                  <>
                    <div className="text-[15px] font-medium tabular-nums text-ink-200">{liquidity}</div>
                    <div className="text-[12px] text-ink-500">liquidity</div>
                  </>
                )}
              </div>
              <div className="flex min-w-[112px] flex-col items-end gap-1">
                <span className="text-[16px] font-semibold tracking-[-0.02em] tabular-nums">{formatPrice(l.priceUsd)}</span>
                <ChangePill pct={l.change24hPct} digits={l.change24hPct !== null && Math.abs(l.change24hPct) >= 100 ? 0 : 1} />
              </div>
              <div className="hidden w-[92px] justify-end md:flex">
                <ExternalLinkBadge href={l.link} label="DexScreener" />
              </div>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="px-4 py-12 text-center text-[15px] text-ink-400">No listings for this chain right now.</li>
        )}
      </ul>
    </div>
  );
}
