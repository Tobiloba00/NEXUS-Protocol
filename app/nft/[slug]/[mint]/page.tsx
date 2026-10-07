import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchTokenDetail } from "@/lib/data-sources/magiceden";
import { ExternalLinkBadge } from "@/components/ui/ExternalLinkBadge";
import { TokenIcon } from "@/components/ui/TokenIcon";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; mint: string }>;
}): Promise<Metadata> {
  const { mint } = await params;
  const token = await fetchTokenDetail(mint);
  return { title: token?.name ?? "NFT" };
}

function truncateAddress(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export default async function NftDetailPage({
  params,
}: {
  params: Promise<{ slug: string; mint: string }>;
}) {
  const { slug, mint } = await params;
  const token = await fetchTokenDetail(mint);
  if (!token) notFound();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
      <Link href={`/nft/${slug}`} className="text-xs text-ink-400 hover:text-ink-100">
        ← {slug.replace(/-/g, " ")}
      </Link>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <TokenIcon src={token.image} alt={token.name} className="aspect-square w-full rounded-xl2" rounded={false} />

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-lg font-semibold">{token.name}</h1>
            {token.collectionName && (
              <Link href={`/nft/${slug}`} className="text-sm text-ink-400 hover:text-ink-100">
                {token.collectionName}
              </Link>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl2 border border-line bg-surface p-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-500">Owner</div>
              <div className="text-sm tabular-nums">{token.owner ? truncateAddress(token.owner) : "—"}</div>
            </div>
            <ExternalLinkBadge href={`https://magiceden.io/item-details/${mint}`} label="Magic Eden" />
          </div>

          {token.attributes.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold">Attributes</h2>
              <div className="grid grid-cols-2 gap-2">
                {token.attributes.map((a) => (
                  <div key={a.trait} className="rounded-lg border border-line bg-surface-2 p-2.5">
                    <div className="text-[10px] uppercase tracking-wider text-ink-500">{a.trait}</div>
                    <div className="truncate text-xs font-medium">{a.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
