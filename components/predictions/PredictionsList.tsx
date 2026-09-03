"use client";

import { useMemo, useState } from "react";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { ExternalLinkBadge } from "@/components/ui/ExternalLinkBadge";
import type { PredictionMarket } from "@/lib/data-sources/types";

function formatVolume(n: number | null) {
  if (n === null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// Polymarket's Gamma API doesn't expose a reliable free category/tag field
// per market — rather than build Politics/Crypto/Sports tabs with nothing
// real behind them, these two tabs are both genuinely derived from data
// already fetched: sorted by volume (Trending) or by end date, soonest
// first (Closing Soon) as a proxy for "New" that's actually meaningful.
export function PredictionsList({ markets }: { markets: PredictionMarket[] }) {
  const [tab, setTab] = useState<"trending" | "closing">("trending");

  const sorted = useMemo(() => {
    if (tab === "trending") return [...markets].sort((a, b) => (b.volumeUsd ?? 0) - (a.volumeUsd ?? 0));
    return [...markets]
      .filter((m) => m.endDate)
      .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime());
  }, [markets, tab]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5 rounded-lg bg-surface-2 p-1" style={{ width: "fit-content" }}>
        <button
          onClick={() => setTab("trending")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${
            tab === "trending" ? "bg-surface text-ink-50 shadow-[var(--shadow-card)]" : "text-ink-400"
          }`}
        >
          Trending
        </button>
        <button
          onClick={() => setTab("closing")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${
            tab === "closing" ? "bg-surface text-ink-50 shadow-[var(--shadow-card)]" : "text-ink-400"
          }`}
        >
          Closing Soon
        </button>
      </div>

      <ul className="flex flex-col gap-3">
        {sorted.map((m) => {
          const outcomes = [...m.outcomes].sort((a, b) => (b.probability ?? 0) - (a.probability ?? 0)).slice(0, 3);
          return (
            <li key={m.slug} className="flex flex-col gap-3 rounded-xl2 border border-line bg-surface p-4">
              <div className="flex items-start gap-3">
                <TokenIcon src={m.image} alt={m.question} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{m.question}</p>
                  <p className="mt-0.5 text-xs text-ink-400">Volume {formatVolume(m.volumeUsd)}</p>
                </div>
                <ExternalLinkBadge href={m.link} label="Polymarket" />
              </div>
              <div className="flex flex-col gap-1.5">
                {outcomes.map((o) => {
                  const pct = o.probability !== null ? Math.round(o.probability * 100) : 0;
                  return (
                    <div key={o.label} className="flex items-center gap-2 text-xs">
                      <span className="w-16 shrink-0 truncate text-ink-300">{o.label}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-10 shrink-0 text-right tabular-nums text-ink-300">
                        {o.probability !== null ? `${pct}%` : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
        {sorted.length === 0 && <li className="px-4 py-6 text-sm text-ink-400">No data right now.</li>}
      </ul>
    </div>
  );
}
