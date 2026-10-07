import type { Metadata } from "next";
import { getNewListings } from "@/lib/data/cache";
import { Page, PageHeader } from "@/components/layout/Page";
import { ListingsTable } from "@/components/listings/ListingsTable";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "New Listings",
  description: "Freshly listed tokens across chains, sourced from DexScreener in real time.",
};

export default async function NewListingsPage() {
  const { data: listings } = await getNewListings(30);

  return (
    <Page>
      <PageHeader title="New Listings" subtitle="Tokens that just appeared on a DEX, newest first." />
      <ListingsTable listings={listings} />
    </Page>
  );
}
