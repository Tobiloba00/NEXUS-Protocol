import type { Metadata } from "next";
import { fetchAllNftCollections } from "@/lib/data-sources/nft-aggregate";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "NFT Marketplace",
  description: "NFT collection floor prices aggregated across marketplaces, updated automatically.",
};

export default async function NftPage() {
  const collections = await fetchAllNftCollections(40);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-12">
      <h1 className="text-xl font-semibold">NFT Collections</h1>
      <p className="text-sm text-ink-400">Floor prices via Magic Eden (Solana).</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {collections.map((c) => (
          <li key={c.id}>
            <a
              href={c.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl2 border border-line bg-surface p-3 hover:bg-hover"
            >
              {c.image && (
                // Magic Eden serves images from many different CDNs per
                // collection — not worth a next.config.ts remotePatterns
                // allowlist for a v1 list page; plain <img> is fine here.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{c.name}</div>
                <div className="text-xs text-ink-400">
                  Floor: {c.floorPrice !== null ? `${c.floorPrice.toFixed(2)} ${c.currency}` : "—"}
                </div>
              </div>
            </a>
          </li>
        ))}
        {collections.length === 0 && (
          <li className="px-4 py-6 text-sm text-ink-400">No data right now — try again shortly.</li>
        )}
      </ul>
    </main>
  );
}
