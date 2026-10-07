import type { Metadata } from "next";
import Link from "next/link";
import { fetchOhlc } from "@/lib/data-sources/coingecko";
import { getMarkets, getNewListings } from "@/lib/data/cache";
import { fetchGlobalStats, fetchFearGreed } from "@/lib/data-sources/global-stats";
import { fetchCrowdLadder } from "@/lib/data-sources/polymarket";
import { getLatestBrief } from "@/lib/ai/brief";
import { BriefCard } from "@/components/dashboard/BriefCard";
import { LAUNCH_PAIRS } from "@/lib/exchanges/pairs";
import { Page, PageHeader } from "@/components/layout/Page";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ChangePill } from "@/components/ui/ChangePill";
import { TopMovers } from "@/components/dashboard/TopMovers";
import { HeroChart } from "@/components/charts/HeroChart";
import { CrowdLadder } from "@/components/crowd/CrowdLadder";
import { LiveTicker } from "@/components/charts/LiveTicker";
import { CompactPrice } from "@/components/charts/CompactPrice";
import { TokenIcon } from "@/components/ui/TokenIcon";
import type { SeedCandle } from "@/components/charts/PriceChart";

export const revalidate = 120;

export const metadata: Metadata = {
  description:
    "Live crypto data from top sources, all in one place — prices, new listings, NFT floors, and prediction-market odds.",
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

function Pulse({
  label,
  value,
  note,
  change,
}: {
  label: string;
  value: string;
  note?: string;
  change?: number | null;
}) {
  return (
    <div className="flex flex-col gap-1.5 bg-surface px-5 py-4">
      <dt className="text-[13px] text-ink-400">{label}</dt>
      <dd className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className="text-[24px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{value}</span>
        {change !== undefined && <ChangePill pct={change} digits={2} className="!min-w-0" />}
        {note && <span className="text-[13px] text-ink-400">{note}</span>}
      </dd>
    </div>
  );
}

export default async function Home() {
  const [{ data: markets }, ohlc, globalStats, fearGreed, { data: listings }, ladder, brief] = await Promise.all([
    getMarkets(100),
    fetchOhlc("bitcoin", 1),
    fetchGlobalStats(),
    fetchFearGreed(),
    getNewListings(8),
    fetchCrowdLadder("Bitcoin"),
    getLatestBrief(),
  ]);

  const btc = markets.find((m) => m.id === "bitcoin");
  const seed: SeedCandle[] = ohlc.map(([time, open, high, low, close]) => ({
    time: Math.floor(time / 1000) as SeedCandle["time"],
    open,
    high,
    low,
    close,
  }));

  return (
    <Page>
      <PageHeader title="Markets" subtitle="Crypto, NFTs and prediction odds — live, in one place." />

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] bg-line md:grid-cols-4">
        <Pulse
          label="Market cap"
          value={formatUsd(globalStats.totalMarketCapUsd, { compact: true })}
          change={globalStats.marketCapChangePct24h}
        />
        <Pulse label="24h volume" value={formatUsd(globalStats.totalVolumeUsd, { compact: true })} />
        <Pulse
          label="BTC dominance"
          value={globalStats.btcDominancePct !== null ? `${globalStats.btcDominancePct.toFixed(1)}%` : "—"}
        />
        <Pulse
          label="Fear & Greed"
          value={fearGreed ? String(fearGreed.value) : "—"}
          note={fearGreed?.classification}
        />
      </dl>

      <section className="rise rise-1">
        <div className="mb-5 flex items-center gap-2.5 px-1">
          <TokenIcon src={btc?.image} alt="BTC" size={28} />
          <Link href="/trade/btc-usdt" className="press flex items-baseline gap-2">
            <span className="text-[17px] font-semibold tracking-[-0.02em]">Bitcoin</span>
            <span className="text-[15px] text-ink-400">BTC/USDT</span>
          </Link>
          <Link href="/trade/btc-usdt" className="press ml-auto text-[15px] font-medium text-accent">
            Trade view
          </Link>
        </div>
        <div className="px-1">
          <LiveTicker symbol="BTCUSDT" base="BTC" quote="USDT" seedPrice={btc?.priceUsd ?? null} />
        </div>
        <div className="mt-6">
          <HeroChart pairSlug="btc-usdt" seed={seed} />
        </div>
      </section>

      {brief && <BriefCard brief={brief} />}

      <div className="rise rise-2">
        <CrowdLadder initial={ladder} symbol="BTCUSDT" base="BTC" />
      </div>

      <div className="rise rise-2 grid grid-cols-1 gap-9 md:grid-cols-2 md:items-start md:gap-6 lg:gap-8">
        <TopMovers markets={markets} />

        <section>
          <SectionHeader title="Watchlist" href="/markets" hrefLabel="See all" />
          <ul className="group-card" style={{ "--sep-inset": "64px" } as React.CSSProperties}>
            {LAUNCH_PAIRS.map((pair) => {
              const m = markets.find((mm) => mm.id === pair.coingeckoId);
              return (
                <li key={pair.slug} className="list-row">
                  <Link href={`/trade/${pair.slug}`} className="list-row flex items-center gap-3 px-4 py-3">
                    <TokenIcon src={m?.image} alt={pair.base} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[16px] font-semibold tracking-[-0.015em]">
                        {pair.base}
                        <span className="font-normal text-ink-400">/{pair.quote}</span>
                      </div>
                      <div className="truncate text-[13px] text-ink-400">{m?.name ?? pair.base}</div>
                    </div>
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
        </section>
      </div>

      <section className="rise rise-3">
        <SectionHeader title="New Listings" href="/new-listings" hrefLabel="See all" />
        <div className="no-scrollbar -mx-5 flex snap-x scroll-pl-5 gap-3 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:scroll-pl-8 sm:px-8 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0">
          {listings.map((l) => (
            <Link
              key={l.id}
              href="/new-listings"
              className="press group-card flex w-[176px] shrink-0 snap-start flex-col gap-3 p-4 md:w-auto"
            >
              <TokenIcon src={l.image} alt={l.symbol} size={40} />
              <div className="min-w-0">
                <div className="truncate text-[16px] font-semibold tracking-[-0.015em]">{l.symbol}</div>
                <div className="truncate text-[13px] text-ink-400">{l.name}</div>
              </div>
              <div className="flex flex-col items-start gap-1.5">
                <span className="text-[14px] font-medium tabular-nums text-ink-200">
                  {l.priceUsd !== null ? `$${l.priceUsd < 1 ? l.priceUsd.toPrecision(3) : l.priceUsd.toFixed(2)}` : "—"}
                </span>
                <ChangePill pct={l.change24hPct} digits={0} />
              </div>
            </Link>
          ))}
          {listings.length === 0 && <p className="px-1 text-[15px] text-ink-400">No new listings right now.</p>}
        </div>
      </section>
    </Page>
  );
}
