import type { Metadata } from "next";
import { getNewListings } from "@/lib/data/cache";
import { fetchBinanceListings } from "@/lib/data-sources/exchange-listings";
import { Page, PageHeader } from "@/components/layout/Page";
import { ListingsTable } from "@/components/listings/ListingsTable";
import { ExchangeListings } from "@/components/listings/ExchangeListings";
import { TabPanels } from "@/components/ui/TabPanels";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "New Coins",
  description:
    "Every new coin as it appears: fresh tokens on decentralized exchanges with risk ratings, and new listings announced by Binance — with the ticker each one lists as.",
};

export default async function NewCoinsPage() {
  const [{ data: listings }, exchange] = await Promise.all([getNewListings(30), fetchBinanceListings()]);

  return (
    <Page>
      <PageHeader
        title="New Coins"
        subtitle="Tokens that just appeared on a DEX, and coins exchanges just announced — newest first."
      />
      <p className="-mt-4 rounded-2xl bg-surface px-4 py-3 text-[13.5px] leading-snug text-ink-300">
        <strong className="font-semibold text-ink-100">Information only, not advice.</strong> New tokens are often scams.
        Ratings are an automated heuristic and can&apos;t guarantee safety.
      </p>
      <TabPanels
        tabs={[
          { value: "dex", label: "On DEXs", content: <ListingsTable listings={listings} /> },
          { value: "exchanges", label: "On exchanges", content: <ExchangeListings listings={exchange} /> },
        ]}
      />
    </Page>
  );
}
