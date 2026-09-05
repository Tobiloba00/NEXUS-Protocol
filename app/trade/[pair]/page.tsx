import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPairBySlug, LAUNCH_PAIRS } from "@/lib/exchanges/pairs";
import { fetchOhlc, fetchTopMarkets } from "@/lib/data-sources/coingecko";
import { PriceChart, type SeedCandle } from "@/components/charts/PriceChart";
import { LiveTicker } from "@/components/charts/LiveTicker";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { OrderBook } from "@/components/trading/OrderBook";
import { TradeTape } from "@/components/trading/TradeTape";

// Classic ISR (Cache Components is not enabled in next.config.ts — see
// README/commit history): prerender the launch pairs at build time,
// revalidate periodically so the OHLC seed doesn't go stale for months.
// The live price itself never depends on this — that's the client-side
// Binance WS island below, seeded here only for first paint/SEO.
export const revalidate = 300;

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
    description: `Live ${config.base}/${config.quote} price, 24h change, and real-time candlestick chart — streamed directly from Binance, free, no signup.`,
  };
}

export default async function TradePage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const config = getPairBySlug(pair);
  if (!config) notFound();

  const [ohlc, markets] = await Promise.all([
    fetchOhlc(config.coingeckoId, 1),
    fetchTopMarkets(100),
  ]);
  const icon = markets.find((m) => m.id === config.coingeckoId)?.image ?? null;
  const seed: SeedCandle[] = ohlc.map(([time, open, high, low, close]) => ({
    time: Math.floor(time / 1000) as SeedCandle["time"],
    open,
    high,
    low,
    close,
  }));
  const seedPrice = seed.length ? seed[seed.length - 1].close : null;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-12">
      <div>
        <div className="flex items-center gap-2">
          <TokenIcon src={icon} alt={config.base} size={28} />
          <h1 className="text-xl font-semibold">
            {config.base}/{config.quote}
          </h1>
        </div>
        <div className="mt-2">
          <LiveTicker
            key={config.binanceSymbol}
            symbol={config.binanceSymbol}
            base={config.base}
            quote={config.quote}
            seedPrice={seedPrice}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
        <div className="rounded-xl2 border border-line bg-surface p-2">
          <PriceChart key={config.binanceSymbol} symbol={config.binanceSymbol} seed={seed} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <OrderBook key={`${config.binanceSymbol}-book`} symbol={config.binanceSymbol} />
          <TradeTape key={`${config.binanceSymbol}-tape`} symbol={config.binanceSymbol} />
        </div>
      </div>
    </main>
  );
}
