import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPairBySlug, LAUNCH_PAIRS } from "@/lib/exchanges/pairs";
import { fetchOhlc } from "@/lib/data-sources/coingecko";
import { PriceChart, type SeedCandle } from "@/components/charts/PriceChart";
import { LiveTicker } from "@/components/charts/LiveTicker";

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

  const ohlc = await fetchOhlc(config.coingeckoId, 1);
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
        <h1 className="text-xl font-semibold">
          {config.base}/{config.quote}
        </h1>
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
      <div className="rounded-xl2 border border-line bg-surface p-2">
        <PriceChart key={config.binanceSymbol} symbol={config.binanceSymbol} seed={seed} />
      </div>
    </main>
  );
}
