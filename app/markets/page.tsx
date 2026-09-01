import type { Metadata } from "next";
import Link from "next/link";
import { LAUNCH_PAIRS } from "@/lib/exchanges/pairs";
import { LiveTicker } from "@/components/charts/LiveTicker";

export const metadata: Metadata = {
  title: "Live Markets",
  description: "Live crypto prices across 8 pairs, streamed directly from Binance in real time.",
};

export default function MarketsPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-12">
      <h1 className="text-xl font-semibold">Live Markets</h1>
      <p className="text-sm text-ink-400">
        Real-time prices streamed directly from Binance — click a pair for its full chart.
      </p>
      <ul className="mt-4 flex flex-col divide-y divide-line rounded-xl2 border border-line bg-surface">
        {LAUNCH_PAIRS.map((pair) => (
          <li key={pair.slug}>
            <Link
              href={`/trade/${pair.slug}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-hover"
            >
              <span className="font-medium">
                {pair.base}/{pair.quote}
              </span>
              <LiveTicker key={pair.binanceSymbol} symbol={pair.binanceSymbol} base={pair.base} quote={pair.quote} />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
