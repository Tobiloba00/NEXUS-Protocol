import type { Metadata } from "next";
import { fetchAllNftCollections } from "@/lib/data-sources/nft-aggregate";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { ExternalLinkBadge } from "@/components/ui/ExternalLinkBadge";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "NFT Marketplace",
  description: "NFT collection floor prices aggregated across marketplaces, updated automatically.",
};

const SOURCE_LABEL: Record<string, string> = {
  magiceden: "Magic Eden",
  reservoir: "Reservoir",
  tensor: "Tensor",
};

export default async function NftPage() {
  const collections = await fetchAllNftCollections(40);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-12">
      <h1 className="text-xl font-semibold">NFT Collections</h1>
      <p className="text-sm text-ink-400">Floor prices via Magic Eden (Solana).</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {collections.map((c) => (
          <li
            key={c.id}
            className="flex items-center gap-3 rounded-xl2 border border-line bg-surface p-3"
          >
            <TokenIcon src={c.image} alt={c.name} size={48} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{c.name}</div>
              <div className="text-xs text-ink-400">
                Floor: {c.floorPrice !== null ? `${c.floorPrice.toFixed(2)} ${c.currency}` : "—"}
              </div>
            </div>
            <ExternalLinkBadge href={c.link} label={SOURCE_LABEL[c.source] ?? c.source} />
          </li>
        ))}
        {collections.length === 0 && (
          <li className="px-4 py-6 text-sm text-ink-400">No data right now — try again shortly.</li>
        )}
      </ul>
    </main>
  );
}
