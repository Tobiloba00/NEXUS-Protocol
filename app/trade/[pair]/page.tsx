import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getPairBySlug, LAUNCH_PAIRS } from "@/lib/exchanges/pairs";
import { fetchOhlc } from "@/lib/data-sources/coingecko";
import { getMarkets } from "@/lib/data/cache";
import { fetchCrowdLadder } from "@/lib/data-sources/polymarket";
import { CrowdLadder } from "@/components/crowd/CrowdLadder";
import { Page } from "@/components/layout/Page";
import { PriceChart, type SeedCandle } from "@/components/charts/PriceChart";
import { LiveTicker } from "@/components/charts/LiveTicker";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { AiInsightButton } from "@/components/ask/AiInsightButton";
import { OrderBook } from "@/components/trading/OrderBook";
import { TradeTape } from "@/components/trading/TradeTape";

// Classic ISR (Cache Components is not enabled in next.config.ts — see
// README/commit history): prerender the launch pairs at build time,
// revalidate periodically so the OHLC seed doesn't go stale for months.
// The live price itself never depends on this — that's the client-side
// Binance WS island below, seeded here only for first paint/SEO.
export const revalidate = 300;

const CROWD_ASSETS: Record<string, string> = { BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana" };

export async function generateStaticParams() {
  return LAUNCH_PAIRS.map((p) => ({ pair: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>;
}): Promise<Metadata> {
  const { pair } = await params;
  const config = getPairBySlug(pair);
  if (!config) return {};
  return {
    title: `${config.base}/${config.quote} Live Price & Chart`,
    description: `Live ${config.base}/${config.quote} price, 24h change, and real-time candlestick chart — streamed directly from the exchange, free, no signup.`,
  };
}

export default async function TradePage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const config = getPairBySlug(pair);
  if (!config) notFound();

  // Prediction-market odds exist for a few majors; skip the fetch for the rest.
  const crowdAsset = config.quote === "USDT" ? CROWD_ASSETS[config.base] : undefined;
  const [ohlc, { data: markets }, ladder] = await Promise.all([
    fetchOhlc(config.coingeckoId, 1),
    getMarkets(100),
    crowdAsset ? fetchCrowdLadder(crowdAsset) : Promise.resolve(null),
  ]);
  const coin = markets.find((m) => m.id === config.coingeckoId);
  const seed: SeedCandle[] = ohlc.map(([time, open, high, low, close]) => ({
    time: Math.floor(time / 1000) as SeedCandle["time"],
    open,
    high,
    low,
    close,
  }));
  const seedPrice = seed.length ? seed[seed.length - 1].close : null;

  return (
    <Page>
      <div className="flex flex-col gap-6">
        <Link href="/markets" className="press -ml-1 inline-flex items-center gap-0.5 self-start text-[15px] font-medium text-accent">
          <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
          Markets
        </Link>
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <TokenIcon src={coin?.image} alt={config.base} size={36} />
            <div>
              <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.025em]">
                {config.base}
                <span className="font-normal text-ink-400">/{config.quote}</span>
              </h1>
              <p className="text-[13px] text-ink-400">{coin?.name ?? config.base}</p>
            </div>
          </div>
          <AiInsightButton
            className="self-start"
            question={`Give me an insight on ${coin?.name ?? config.base}: price and 24h move, where it ranks among movers, and what the crowd odds say if available.`}
          />
          <LiveTicker
            key={config.binanceSymbol}
            symbol={config.binanceSymbol}
            base={config.base}
            quote={config.quote}
            seedPrice={seedPrice}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_330px]">
        <PriceChart key={config.binanceSymbol} symbol={config.binanceSymbol} seed={seed} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <OrderBook key={`${config.binanceSymbol}-book`} symbol={config.binanceSymbol} />
          <TradeTape key={`${config.binanceSymbol}-tape`} symbol={config.binanceSymbol} />
        </div>
      </div>

      <CrowdLadder initial={ladder} symbol={config.binanceSymbol} base={config.base} />
    </Page>
  );
}
