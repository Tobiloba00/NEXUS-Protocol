import type { Metadata } from "next";
import { fetchNewTokenProfiles } from "@/lib/data-sources/dexscreener";
import { ListingsTable } from "@/components/listings/ListingsTable";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "New Listings",
  description: "Freshly listed tokens across chains, sourced from DexScreener in real time.",
};

export default async function NewListingsPage() {
  const listings = await fetchNewTokenProfiles(30);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-xl font-semibold">New Token Listings</h1>
        <p className="mt-1 text-sm text-ink-400">Freshly listed tokens across all chains.</p>
      </div>
      <ListingsTable listings={listings} />
    </main>
  );
}
