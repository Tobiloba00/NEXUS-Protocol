import type { Metadata } from "next";
import { fetchAllNftCollections } from "@/lib/data-sources/nft-aggregate";
import { NftGrid } from "@/components/nft/NftGrid";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "NFT Marketplace",
  description: "NFT collection floor prices aggregated across marketplaces, updated automatically.",
};

export default async function NftPage() {
  const collections = await fetchAllNftCollections(40);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-xl font-semibold">Top NFT Collections</h1>
        <p className="mt-1 text-sm text-ink-400">Floor prices across all top marketplaces.</p>
      </div>
      <NftGrid collections={collections} />
    </main>
  );
}
