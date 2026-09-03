import type { Metadata } from "next";
import { fetchActiveMarkets } from "@/lib/data-sources/polymarket";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Prediction Markets",
  description:
    "Read-only odds from Polymarket prediction markets — informational only, not a betting service.",
};

export default async function PredictionsPage() {
  const markets = await fetchActiveMarkets(40);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-12">
      <h1 className="text-xl font-semibold">Prediction Markets</h1>
      <p className="text-sm text-ink-400">
        Odds shown for information only, sourced from Polymarket. We don&apos;t facilitate wagering
        — use the link to trade on Polymarket directly.
      </p>
      <ul className="mt-4 flex flex-col divide-y divide-line rounded-xl2 border border-line bg-surface">
        {markets.map((m) => {
          const top = [...m.outcomes].sort((a, b) => (b.probability ?? 0) - (a.probability ?? 0))[0];
          return (
            <li key={m.slug}>
              <a
                href={m.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-hover"
              >
                <span className="line-clamp-2 text-sm">{m.question}</span>
                {top && (
                  <span className="shrink-0 rounded-full bg-surface-2 px-2 py-1 text-xs tabular-nums">
                    {top.label} {top.probability !== null ? `${Math.round(top.probability * 100)}%` : ""}
                  </span>
                )}
              </a>
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
