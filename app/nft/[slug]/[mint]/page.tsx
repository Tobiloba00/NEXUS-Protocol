import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { fetchTokenDetail } from "@/lib/data-sources/magiceden";
import { Page } from "@/components/layout/Page";
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
    <Page narrow>
      <Link
        href={`/nft/${slug}`}
        className="press -ml-1 inline-flex items-center gap-0.5 self-start text-[15px] font-medium capitalize text-accent"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
        {slug.replace(/[-_]/g, " ")}
      </Link>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div className="overflow-hidden rounded-[24px] bg-surface-2">
          <TokenIcon src={token.image} alt={token.name} className="aspect-square w-full" rounded={false} />
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="t-title">{token.name}</h1>
            {token.collectionName && (
              <Link href={`/nft/${slug}`} className="press mt-1 inline-block text-[15px] font-medium text-accent">
                {token.collectionName}
              </Link>
            )}
          </div>

          <div className="group-card flex items-center justify-between gap-3 px-4 py-3.5">
            <div>
              <div className="text-[13px] text-ink-400">Owner</div>
              <div className="text-[16px] font-medium tabular-nums">{token.owner ? truncateAddress(token.owner) : "—"}</div>
            </div>
            <ExternalLinkBadge href={`https://magiceden.io/item-details/${mint}`} label="Magic Eden" />
          </div>

          {token.attributes.length > 0 && (
            <section>
              <h2 className="t-section mb-2.5 px-1">Attributes</h2>
              <div className="grid grid-cols-2 gap-2">
                {token.attributes.map((a) => (
                  <div key={a.trait} className="rounded-2xl bg-surface px-3.5 py-3">
                    <div className="text-[12px] text-ink-400">{a.trait}</div>
                    <div className="truncate text-[14px] font-semibold tracking-[-0.01em]">{a.value}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </Page>
  );
}
