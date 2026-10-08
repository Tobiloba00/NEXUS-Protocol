import type { Metadata } from "next";
import { getMarkets } from "@/lib/data/cache";
import { slimCoin } from "@/lib/data/slim";
import { fetchGlobalStats, fetchFearGreed } from "@/lib/data-sources/global-stats";
import { Page, PageHeader } from "@/components/layout/Page";
import { MarketsTable } from "@/components/markets/MarketsTable";
import { MarketPulse } from "@/components/dashboard/MarketPulse";
import { TopMovers } from "@/components/dashboard/TopMovers";

export const revalidate = 300; // list + sparklines come from the cache; prices tick live in the browser

export const metadata: Metadata = {
  title: "Live Crypto Prices — Top 100 Coins",
  description:
    "The top 100 cryptocurrencies by market cap with live prices, 24h and 7-day moves and trend lines, streamed in real time.",
};

export default async function MarketsPage() {
  const [{ data: markets }, stats, fearGreed] = await Promise.all([getMarkets(100), fetchGlobalStats(), fetchFearGreed()]);
  const coins = markets.map(slimCoin);

  return (
    <Page
      aside={
        <>
          <MarketPulse stats={stats} fearGreed={fearGreed} />
          <TopMovers markets={coins} />
        </>
      }
    >
      <PageHeader title="Markets" subtitle="The top 100 coins by market cap, live. Tap any coin for its chart." />
      <MarketsTable coins={coins} />
    </Page>
  );
}
