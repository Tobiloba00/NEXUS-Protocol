import type { Metadata } from "next";
import Link from "next/link";
import { LAUNCH_PAIRS } from "@/lib/exchanges/pairs";
import { getMarkets } from "@/lib/data/cache";
import { Page, PageHeader } from "@/components/layout/Page";
import { CompactPrice } from "@/components/charts/CompactPrice";
import { TokenIcon } from "@/components/ui/TokenIcon";

export const revalidate = 300; // just for the icon/name lookup — prices themselves are live via WS

export const metadata: Metadata = {
  title: "Live Markets",
  description: "Live crypto prices across 8 pairs, streamed directly from the exchange in real time.",
};

export default async function MarketsPage() {
  const { data: markets } = await getMarkets(100);
  const byCoinId = new Map(markets.map((m) => [m.id, m]));

  return (
    <Page narrow>
      <PageHeader title="Markets" subtitle="Real-time prices, straight from the exchange. Tap a pair for its full chart." />
      <ul className="group-card" style={{ "--sep-inset": "68px" } as React.CSSProperties}>
        {LAUNCH_PAIRS.map((pair) => {
          const m = byCoinId.get(pair.coingeckoId);
          return (
            <li key={pair.slug} className="list-row">
              <Link href={`/trade/${pair.slug}`} className="list-row flex items-center gap-3.5 px-4 py-3.5">
                <TokenIcon src={m?.image} alt={pair.base} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[17px] font-semibold tracking-[-0.018em]">
                    {pair.base}
                    <span className="font-normal text-ink-400">/{pair.quote}</span>
                  </div>
                  <div className="truncate text-[13px] text-ink-400">{m?.name ?? pair.base}</div>
                </div>
                <CompactPrice key={pair.binanceSymbol} symbol={pair.binanceSymbol} seedPrice={m?.priceUsd ?? null} />
              </Link>
            </li>
          );
        })}
      </ul>
    </Page>
  );
}
