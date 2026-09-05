import type { Metadata } from "next";
import Link from "next/link";
import { fetchTopMarkets, fetchOhlc } from "@/lib/data-sources/coingecko";
import { fetchNewTokenProfiles } from "@/lib/data-sources/dexscreener";
import { fetchGlobalStats, fetchFearGreed } from "@/lib/data-sources/global-stats";
import { LAUNCH_PAIRS } from "@/lib/exchanges/pairs";
import { StatTile } from "@/components/ui/StatTile";
import { TopMovers } from "@/components/dashboard/TopMovers";
import { MiniPriceChart } from "@/components/charts/MiniPriceChart";
import { LiveTicker } from "@/components/charts/LiveTicker";
import { CompactPrice } from "@/components/charts/CompactPrice";
import { TokenIcon } from "@/components/ui/TokenIcon";
import type { SeedCandle } from "@/components/charts/PriceChart";

export const revalidate = 120;

export const metadata: Metadata = {
  description:
    "Live crypto data from top sources, all in one terminal — prices, new listings, NFT floors, and prediction-market odds.",
};

function formatUsd(n: number | null, opts: { compact?: boolean } = {}) {
  if (n === null) return "—";
  if (opts.compact) {
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  }
  return `$${n.toLocaleString()}`;
}

export default async function Home() {
  const [markets, ohlc, globalStats, fearGreed, listings] = await Promise.all([
    fetchTopMarkets(100),
    fetchOhlc("bitcoin", 1),
    fetchGlobalStats(),
    fetchFearGreed(),
    fetchNewTokenProfiles(6),
  ]);

  const withChange = markets.filter((m) => m.change24hPct !== null);
  const gainers = [...withChange].sort((a, b) => (b.change24hPct ?? 0) - (a.change24hPct ?? 0)).slice(0, 5);
  const losers = [...withChange].sort((a, b) => (a.change24hPct ?? 0) - (b.change24hPct ?? 0)).slice(0, 5);

  const btc = markets.find((m) => m.id === "bitcoin");
  const seed: SeedCandle[] = ohlc.map(([time, open, high, low, close]) => ({
    time: Math.floor(time / 1000) as SeedCandle["time"],
    open,
    high,
    low,
    close,
  }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-xl font-semibold">Market Overview</h1>
        <p className="mt-1 text-sm text-ink-400">Live crypto data from top sources, all in one terminal.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Total Market Cap"
          value={formatUsd(globalStats.totalMarketCapUsd, { compact: true })}
          changePct={globalStats.marketCapChangePct24h}
        />
        <StatTile label="24H Volume" value={formatUsd(globalStats.totalVolumeUsd, { compact: true })} />
        <StatTile
          label="BTC Dominance"
          value={globalStats.btcDominancePct !== null ? `${globalStats.btcDominancePct.toFixed(2)}%` : "—"}
        />
        <StatTile
          label="Fear & Greed"
          value={fearGreed ? String(fearGreed.value) : "—"}
          sub={fearGreed?.classification}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr_1fr]">
        <TopMovers gainers={gainers} losers={losers} />

        <div className="flex flex-col rounded-xl2 border border-line bg-surface">
          <div className="flex items-center justify-between px-4 pt-4">
            <div>
              <div className="flex items-center gap-2">
                <TokenIcon src={btc?.image} alt="BTC" size={22} />
                <span className="text-sm font-semibold">BTC/USDT</span>
              </div>
              <div className="mt-1">
                <LiveTicker symbol="BTCUSDT" base="BTC" quote="USDT" seedPrice={btc?.priceUsd ?? null} />
              </div>
            </div>
          </div>
          <MiniPriceChart pairSlug="btc-usdt" seed={seed} />
        </div>

        <div className="flex flex-col rounded-xl2 border border-line bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold">Market Summary</h3>
          <ul className="flex flex-col gap-2.5">
            {LAUNCH_PAIRS.map((pair) => {
              const m = markets.find((mm) => mm.id === pair.coingeckoId);
              return (
                <li key={pair.slug}>
                  <Link
                    href={`/trade/${pair.slug}`}
                    className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 hover:bg-hover"
                  >
                    <TokenIcon src={m?.image} alt={pair.base} size={24} />
                    <span className="flex-1 text-sm font-medium">
                      {pair.base}/{pair.quote}
                    </span>
                    <CompactPrice
                      key={pair.binanceSymbol}
                      symbol={pair.binanceSymbol}
                      seedPrice={m?.priceUsd ?? null}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link href="/markets" className="mt-3 text-xs font-medium text-accent hover:underline">
            View all markets →
          </Link>
        </div>
      </div>

      <div className="rounded-xl2 border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Latest New Listings</h3>
          <Link href="/new-listings" className="text-xs font-medium text-accent hover:underline">
            View all →
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {listings.map((l) => (
            <div
              key={l.id}
              className="flex w-40 shrink-0 flex-col gap-2 rounded-xl2 border border-line bg-surface-2 p-3"
            >
              <TokenIcon src={l.image} alt={l.symbol} size={32} />
              <div className="truncate text-sm font-medium">{l.name}</div>
              <div className="text-xs tabular-nums text-ink-300">
                {l.priceUsd !== null
                  ? `$${l.priceUsd < 1 ? l.priceUsd.toPrecision(3) : l.priceUsd.toFixed(2)}`
                  : "—"}
              </div>
              {l.change24hPct !== null && (
                <div className={`text-xs ${l.change24hPct >= 0 ? "text-pos" : "text-neg"}`}>
                  {l.change24hPct >= 0 ? "+" : ""}
                  {l.change24hPct.toFixed(1)}%
                </div>
              )}
            </div>
          ))}
          {listings.length === 0 && <p className="text-sm text-ink-400">No data right now.</p>}
        </div>
      </div>
    </div>
  );
}
