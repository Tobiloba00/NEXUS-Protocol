"use client";

import { useMemo, useState } from "react";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { ExternalLinkBadge } from "@/components/ui/ExternalLinkBadge";
import type { Listing } from "@/lib/data-sources/types";

function formatAge(pairCreatedAt: number | null) {
  if (!pairCreatedAt) return "—";
  const ms = Date.now() - pairCreatedAt;
  const hours = ms / 3_600_000;
  if (hours < 1) return `${Math.max(1, Math.round(ms / 60_000))}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function formatCompactUsd(n: number | null) {
  if (n === null) return "—";
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

const CHAIN_LABEL: Record<string, string> = {
  solana: "Solana",
  ethereum: "Ethereum",
  bsc: "BNB Chain",
  base: "Base",
  arbitrum: "Arbitrum",
};

export function ListingsTable({ listings }: { listings: Listing[] }) {
  const [chain, setChain] = useState<string>("all");

  const chains = useMemo(() => {
    const seen = new Set(listings.map((l) => l.chain).filter((c): c is string => !!c));
    return Array.from(seen);
  }, [listings]);

  const filtered = chain === "all" ? listings : listings.filter((l) => l.chain === chain);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5 overflow-x-auto rounded-lg bg-surface-2 p-1">
        <button
          onClick={() => setChain("all")}
          className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium ${
            chain === "all" ? "bg-surface text-ink-50 shadow-[var(--shadow-card)]" : "text-ink-400"
          }`}
        >
          All Chains
        </button>
        {chains.map((c) => (
          <button
            key={c}
            onClick={() => setChain(c)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium ${
              chain === c ? "bg-surface text-ink-50 shadow-[var(--shadow-card)]" : "text-ink-400"
            }`}
          >
            {CHAIN_LABEL[c] ?? c}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl2 border border-line bg-surface">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-ink-500">
              <th className="px-4 py-3 font-medium">Token</th>
              <th className="px-4 py-3 font-medium">Chain</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">24H Change</th>
              <th className="px-4 py-3 font-medium">Liquidity</th>
              <th className="px-4 py-3 font-medium">Age</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-b border-line last:border-none hover:bg-hover">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <TokenIcon src={l.image} alt={l.symbol} size={28} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{l.symbol}</div>
                      <div className="truncate text-xs text-ink-400">{l.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-ink-300">{l.chain ? CHAIN_LABEL[l.chain] ?? l.chain : "—"}</td>
                <td className="px-4 py-3 text-sm tabular-nums">
                  {l.priceUsd !== null ? `$${l.priceUsd < 1 ? l.priceUsd.toPrecision(4) : l.priceUsd.toFixed(2)}` : "—"}
                </td>
                <td className="px-4 py-3 text-sm tabular-nums">
                  {l.change24hPct !== null ? (
                    <span className={l.change24hPct >= 0 ? "text-pos" : "text-neg"}>
                      {l.change24hPct >= 0 ? "+" : ""}
                      {l.change24hPct.toFixed(1)}%
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-sm tabular-nums text-ink-300">{formatCompactUsd(l.liquidityUsd)}</td>
                <td className="px-4 py-3 text-sm tabular-nums text-ink-300">{formatAge(l.pairCreatedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <ExternalLinkBadge href={l.link} label="DexScreener" />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-400">
                  No listings for this chain right now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
