"use client";

import { useMemo, useState } from "react";
import { ChevronDown, CheckCircle2, TriangleAlert, XCircle } from "lucide-react";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { ChangePill } from "@/components/ui/ChangePill";
import { Segmented } from "@/components/ui/Segmented";
import { ExternalLinkBadge } from "@/components/ui/ExternalLinkBadge";
import { LiveStatusChip } from "@/components/status/LiveStatusChip";
import { RiskBadge } from "./RiskBadge";
import { AiInsightButton } from "@/components/ask/AiInsightButton";
import { SecurityScan } from "./SecurityScan";
import { fetchNewTokenProfiles } from "@/lib/data-sources/dexscreener";
import { assessRisk, type RiskAssessment } from "@/lib/risk/score";
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

const REASON_ICON = {
  good: <CheckCircle2 className="h-[17px] w-[17px] shrink-0 text-pos" strokeWidth={2} />,
  warn: <TriangleAlert className="h-[17px] w-[17px] shrink-0 text-warn" strokeWidth={2} />,
  bad: <XCircle className="h-[17px] w-[17px] shrink-0 text-neg" strokeWidth={2} />,
} as const;

/** Expanded detail: the plain-language reasons behind the rating, plus the
 * on-demand contract scan. Always carries the "not advice" caveat. */
function RiskDetail({ listing, risk }: { listing: Listing; risk: RiskAssessment | null }) {
  const [chain, ...rest] = listing.id.split(":");
  const address = rest.join(":");

  return (
    <div className="flex flex-col gap-5 px-4 pb-5 pt-1 sm:pl-[68px]">
      {risk && (
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[13px] font-semibold text-ink-400">Why this rating</h3>
          <ul className="flex flex-col gap-2">
            {risk.reasons.map((r) => (
              <li key={r.text} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-ink-200">
                {REASON_ICON[r.kind]}
                {r.text}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-col gap-2.5">
        <h3 className="text-[13px] font-semibold text-ink-400">Contract check</h3>
        <SecurityScan chain={chain} address={address} />
      </div>
      <p className="text-[12px] leading-snug text-ink-400">
        The rating is an automated heuristic from trading data. It flags common red flags but can&apos;t guarantee
        a token is safe or a scam. Not financial advice.
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <AiInsightButton
          label="AI insight on this token"
          question={`Give me an insight on the new ${listing.symbol} token (${listing.name}) on ${chain}: liquidity, age, trading balance and the main risk factors from the data.`}
        />
        <ExternalLinkBadge href={listing.link} label="Open on DexScreener" />
      </div>
    </div>
  );
}

/** `listings` is the server's cached snapshot (first paint + SEO); the
 * browser then refreshes straight from DexScreener every 20s. */
export function ListingsTable({ listings: initial }: { listings: Listing[] }) {
  const { data: listings, status } = usePolled(fetchFreshListings, initial, REFRESH_MS);
  const [chain, setChain] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);

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
          const risk = assessRisk(l);
          const open = openId === l.id;
          return (
            <li key={l.id} className="list-row">
              <button
                onClick={() => setOpenId(open ? null : l.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-hover"
              >
                <TokenIcon src={l.image} alt={l.symbol} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="min-w-0 truncate text-[16px] font-semibold tracking-[-0.015em]">{l.symbol}</span>
                    {risk && <RiskBadge level={risk.level} />}
                  </div>
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
                <div className="flex min-w-[104px] flex-col items-end gap-1">
                  <span className="text-[16px] font-semibold tracking-[-0.02em] tabular-nums">{formatPrice(l.priceUsd)}</span>
                  <ChangePill pct={l.change24hPct} digits={l.change24hPct !== null && Math.abs(l.change24hPct) >= 100 ? 0 : 1} />
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-ink-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                  strokeWidth={2.2}
                  aria-hidden
                />
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">{open && <RiskDetail listing={l} risk={risk} />}</div>
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
