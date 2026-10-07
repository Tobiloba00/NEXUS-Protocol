import type { Metadata } from "next";
import { getNftCollections } from "@/lib/data/cache";
import { Page, PageHeader } from "@/components/layout/Page";
import { NftGrid } from "@/components/nft/NftGrid";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "NFT Marketplace",
  description: "NFT collection floor prices aggregated across marketplaces, updated automatically.",
};

export default async function NftPage() {
  const { data: collections } = await getNftCollections(40);

  return (
    <Page>
      <PageHeader title="NFTs" subtitle="Top collections and their floor prices across marketplaces." />
      <NftGrid collections={collections} />
    </Page>
  );
}
