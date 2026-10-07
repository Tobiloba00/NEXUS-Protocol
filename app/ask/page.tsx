import type { Metadata } from "next";
import { Page, PageHeader } from "@/components/layout/Page";
import { AskChat } from "@/components/ask/AskChat";

export const metadata: Metadata = {
  title: "Ask Nexus",
  description:
    "Ask questions about live crypto prices, new token listings and their risk, and prediction-market odds — answered from live data.",
};

export default function AskPage() {
  return (
    <Page
      aside={
        <>
          <section className="group-card flex flex-col gap-3 p-5">
            <h2 className="t-headline">What it can see</h2>
            <ul className="flex flex-col gap-2 text-[14px] leading-snug text-ink-300">
              <li>Live prices and 24h moves for the top 100 coins</li>
              <li>The newest DEX tokens, with risk ratings and reasons</li>
              <li>Polymarket odds, including the crowd&apos;s daily price outlook for BTC, ETH and SOL</li>
              <li>Top NFT collections and floor prices</li>
            </ul>
          </section>
          <section className="group-card flex flex-col gap-3 p-5">
            <h2 className="t-headline">What it can&apos;t do</h2>
            <ul className="flex flex-col gap-2 text-[14px] leading-snug text-ink-300">
              <li>See the news, so it can&apos;t explain <em className="not-italic font-medium text-ink-100">why</em> a price moved</li>
              <li>Give financial advice or tell you to buy or sell</li>
              <li>Guarantee a token is safe — ratings are an automated heuristic</li>
            </ul>
          </section>
        </>
      }
    >
      <PageHeader title="Ask Nexus" subtitle="Plain-English answers, straight from live market data." />
      <AskChat />
    </Page>
  );
}
