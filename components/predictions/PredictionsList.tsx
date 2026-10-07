"use client";

import { useMemo, useState } from "react";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { ExternalLinkBadge } from "@/components/ui/ExternalLinkBadge";
import { Segmented } from "@/components/ui/Segmented";
import { LiveStatusChip } from "@/components/status/LiveStatusChip";
import { fetchActiveMarkets } from "@/lib/data-sources/polymarket";
import { usePolled } from "@/lib/live/usePolled";
import type { PredictionMarket } from "@/lib/data-sources/types";

const REFRESH_MS = 15000;
const PAGE_SIZE = 12;

async function fetchFreshMarkets() {
  const rows = await fetchActiveMarkets(40);
  if (!rows.length) throw new Error("no markets returned"); // keep previous odds on screen
  return rows;
}

function formatVolume(n: number | null) {
  if (n === null) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatEnds(endDate: string | null) {
  if (!endDate) return null;
  const d = new Date(endDate);
  if (Number.isNaN(d.getTime())) return null;
  // Fixed locale + UTC: the server and the browser must render identical text.
  return `Ends ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}`;
}

// Polymarket's Gamma API doesn't expose a reliable free category/tag field
// per market — rather than build Politics/Crypto/Sports tabs with nothing
// real behind them, these two tabs are both genuinely derived from data
// already fetched: sorted by volume (Trending) or by end date, soonest
// first (Closing Soon).
export function PredictionsList({ markets: initial }: { markets: PredictionMarket[] }) {
  // Server snapshot for first paint/SEO; browser then refreshes odds straight from Polymarket every 15s.
  const { data: markets, status } = usePolled(fetchFreshMarkets, initial, REFRESH_MS);
  const [tab, setTab] = useState<"trending" | "closing">("trending");
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() => {
    if (tab === "trending") return [...markets].sort((a, b) => (b.volumeUsd ?? 0) - (a.volumeUsd ?? 0));
    return [...markets]
      .filter((m) => m.endDate)
      .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime());
  }, [markets, tab]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          ariaLabel="Sort"
          value={tab}
          onChange={setTab}
          options={[
            { value: "trending", label: "Trending" },
            { value: "closing", label: "Closing soon" },
          ]}
        />
        <LiveStatusChip status={status} source="Polymarket · every 15s" />
      </div>

      <ul className="flex flex-col gap-3">
        {sorted.slice(0, showAll ? undefined : PAGE_SIZE).map((m) => {
          // Yes/No markets keep their natural order (Yes first); multi-option
          // markets show their most likely outcomes.
          const outcomes =
            m.outcomes.length <= 2
              ? m.outcomes
              : [...m.outcomes].sort((a, b) => (b.probability ?? 0) - (a.probability ?? 0)).slice(0, 3);
          const meta = [formatVolume(m.volumeUsd) && `${formatVolume(m.volumeUsd)} volume`, formatEnds(m.endDate)]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={m.slug} className="group-card flex flex-col gap-4 p-5">
              <div className="flex items-start gap-3.5">
                <TokenIcon src={m.image} alt={m.question} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-semibold leading-snug tracking-[-0.015em]">{m.question}</p>
                  {meta && <p className="mt-1 text-[13px] text-ink-400">{meta}</p>}
                </div>
                <ExternalLinkBadge href={m.link} label="Polymarket" />
              </div>
              <div className="flex flex-col gap-3">
                {outcomes.map((o, i) => {
                  const pct = o.probability !== null ? Math.round(o.probability * 100) : null;
                  return (
                    <div key={o.label} className="flex flex-col gap-1.5">
                      <div className="flex items-baseline justify-between text-[14px]">
                        <span className="truncate text-ink-300">{o.label}</span>
                        <span className={`text-[17px] font-semibold tabular-nums tracking-[-0.02em] ${i === 0 ? "text-ink-50" : "text-ink-300"}`}>
                          {pct !== null ? `${pct}%` : "—"}
                        </span>
                      </div>
                      <div className="h-[6px] overflow-hidden rounded-full bg-surface-2">
                        <div
                          className={`h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${i === 0 ? "bg-accent" : "bg-ink-500"}`}
                          style={{ width: `${pct ?? 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
        {sorted.length === 0 && <li className="group-card px-5 py-12 text-center text-[15px] text-ink-400">No markets right now.</li>}
      </ul>
      {!showAll && sorted.length > PAGE_SIZE && (
        <button
          onClick={() => setShowAll(true)}
          className="press h-[48px] rounded-[14px] bg-surface text-[15px] font-medium text-accent"
        >
          Show all {sorted.length} markets
        </button>
      )}
    </div>
  );
}
