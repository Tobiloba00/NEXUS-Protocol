import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  fetchCollectionActivity,
  fetchCollectionListings,
  fetchCollectionStats,
} from "@/lib/data-sources/magiceden";
import { Page, PageHeader } from "@/components/layout/Page";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TokenIcon } from "@/components/ui/TokenIcon";
import { AiInsightButton } from "@/components/ask/AiInsightButton";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.replace(/[-_]/g, " ") };
}

function timeAgo(blockTimeSec: number | null) {
  if (!blockTimeSec) return "—";
  const seconds = Date.now() / 1000 - blockTimeSec;
  if (seconds < 60) return `${Math.round(seconds)}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
  return `${Math.round(seconds / 86400)}d ago`;
}

const sol = (n: number | null, digits = 2) =>
  n !== null ? `${n.toLocaleString("en-US", { maximumFractionDigits: digits })} SOL` : "—";

const ACTIVITY_LABEL: Record<string, string> = {
  buyNow: "Sale",
  bid: "Bid",
  list: "Listed",
  delist: "Delisted",
  poolUpdate: "Pool update",
};

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [stats, listings, activity] = await Promise.all([
    fetchCollectionStats(slug),
    fetchCollectionListings(slug, 24),
    fetchCollectionActivity(slug, 12),
  ]);

  return (
    <Page>
      <div className="flex flex-col gap-5">
        <Link href="/nft" className="press -ml-1 inline-flex items-center gap-0.5 self-start text-[15px] font-medium text-accent">
          <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
          NFTs
        </Link>
        <PageHeader
          title={slug.replace(/[-_]/g, " ")}
          trailing={
            <div className="flex flex-wrap items-center justify-end gap-3">
              <AiInsightButton
                question={`Give me an insight on the ${slug.replace(/[-_]/g, " ")} NFT collection: its floor, how much is listed, recent sales and anything unusual.`}
              />
              <a
                href={`https://magiceden.io/marketplace/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="press inline-flex h-10 items-center gap-1 rounded-full bg-accent px-4 text-[14px] font-semibold text-white"
              >
                Buy on Magic Eden <span aria-hidden>↗</span>
              </a>
            </div>
          }
        />
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] bg-line sm:grid-cols-4">
        {[
          ["Floor", sol(stats.floorPrice, stats.floorPrice !== null && stats.floorPrice < 1 ? 3 : 2)],
          ["Listed", stats.listedCount !== null ? stats.listedCount.toLocaleString("en-US") : "—"],
          ["Avg price (24h)", sol(stats.avgPrice24h)],
          ["Volume (7d)", sol(stats.volume7d, 0)],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1.5 bg-surface px-5 py-4">
            <dt className="text-[13px] text-ink-400">{label}</dt>
            <dd className="text-[22px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-9 lg:grid-cols-[1fr_340px] lg:gap-8">
        <section>
          <SectionHeader title="Listed" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
            {listings.map((l) => (
              <Link key={l.mintAddress} href={`/nft/${slug}/${l.mintAddress}`} className="press group block">
                <div className="overflow-hidden rounded-[18px] bg-surface-2">
                  <TokenIcon
                    src={l.image}
                    alt={l.name}
                    className="aspect-square w-full transition-transform duration-500 group-hover:scale-[1.04]"
                    rounded={false}
                  />
                </div>
                <div className="mt-2 px-0.5">
                  <div className="truncate text-[14px] font-semibold tracking-[-0.01em]">{l.name}</div>
                  <div className="text-[13px] tabular-nums text-ink-400">{l.price !== null ? `${l.price.toFixed(2)} ${l.currency}` : "—"}</div>
                </div>
              </Link>
            ))}
            {listings.length === 0 && (
              <p className="col-span-full py-10 text-center text-[15px] text-ink-400">No active listings right now.</p>
            )}
          </div>
        </section>

        <section>
          <SectionHeader title="Activity" />
          <ul className="group-card" style={{ "--sep-inset": "16px" } as React.CSSProperties}>
            {activity.map((a) => (
              <li key={a.signature} className="list-row flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="text-[15px] font-medium">{ACTIVITY_LABEL[a.type] ?? a.type}</div>
                  <div className="text-[12.5px] text-ink-400">{timeAgo(a.blockTime)}</div>
                </div>
                <span className="text-[15px] font-semibold tabular-nums">
                  {a.price !== null ? `${a.price.toFixed(2)} ${a.currency}` : "—"}
                </span>
              </li>
            ))}
            {activity.length === 0 && <li className="px-4 py-10 text-center text-[15px] text-ink-400">No recent activity.</li>}
          </ul>
          <p className="mt-3 px-1 text-[12.5px] leading-snug text-ink-400">
            On-chain events, refreshed every couple of minutes — not a tick-by-tick feed.
          </p>
        </section>
      </div>
    </Page>
  );
}
