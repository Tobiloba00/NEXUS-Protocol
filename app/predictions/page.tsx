import type { Metadata } from "next";
import { fetchActiveMarkets } from "@/lib/data-sources/polymarket";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { ExternalLinkBadge } from "@/components/ui/ExternalLinkBadge";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Prediction Markets",
  description:
    "Read-only odds from Polymarket prediction markets — informational only, not a betting service.",
};

function formatVolume(n: number | null) {
  if (n === null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default async function PredictionsPage() {
  const markets = await fetchActiveMarkets(40);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-12">
      <h1 className="text-xl font-semibold">Prediction Markets</h1>
      <p className="text-sm text-ink-400">
        Odds shown for information only, sourced from Polymarket. We don&apos;t facilitate wagering
        — the badge on each market links out to Polymarket if you want to trade.
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {markets.map((m) => {
          const outcomes = [...m.outcomes]
            .sort((a, b) => (b.probability ?? 0) - (a.probability ?? 0))
            .slice(0, 3);
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
        {markets.length === 0 && (
          <li className="px-4 py-6 text-sm text-ink-400">No data right now — try again shortly.</li>
        )}
      </ul>
    </main>
  );
}
