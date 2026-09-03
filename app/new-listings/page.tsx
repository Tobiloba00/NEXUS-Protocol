import type { Metadata } from "next";
import { fetchNewTokenProfiles } from "@/lib/data-sources/dexscreener";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "New Listings",
  description: "Freshly listed tokens across chains, sourced from DexScreener in real time.",
};

export default async function NewListingsPage() {
  const listings = await fetchNewTokenProfiles(20);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-12">
      <h1 className="text-xl font-semibold">New Listings</h1>
      <p className="text-sm text-ink-400">Freshly listed tokens across chains, via DexScreener.</p>
      <ul className="mt-4 flex flex-col divide-y divide-line rounded-xl2 border border-line bg-surface">
        {listings.map((l) => (
          <li key={l.id}>
            <a
              href={l.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-hover"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{l.name}</div>
                <div className="text-xs text-ink-400">{l.symbol}</div>
              </div>
              <div className="shrink-0 text-right">
                {l.priceUsd !== null ? (
                  <>
                    <div className="tabular-nums">
                      ${l.priceUsd < 1 ? l.priceUsd.toPrecision(4) : l.priceUsd.toFixed(2)}
                    </div>
                    {l.change24hPct !== null && (
                      <div className={`text-xs ${l.change24hPct >= 0 ? "text-pos" : "text-neg"}`}>
                        {l.change24hPct >= 0 ? "+" : ""}
                        {l.change24hPct.toFixed(1)}%
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-ink-500">—</span>
                )}
              </div>
            </a>
          </li>
        ))}
        {listings.length === 0 && (
          <li className="px-4 py-6 text-sm text-ink-400">No data right now — try again shortly.</li>
        )}
      </ul>
    </main>
  );
}
