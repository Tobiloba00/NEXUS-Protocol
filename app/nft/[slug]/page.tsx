import type { Metadata } from "next";
import Link from "next/link";
import {
  fetchCollectionActivity,
  fetchCollectionListings,
  fetchCollectionStats,
} from "@/lib/data-sources/magiceden";
import { ExternalLinkBadge } from "@/components/ui/ExternalLinkBadge";
import { TokenIcon } from "@/components/ui/TokenIcon";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.replace(/-/g, " ") };
}

function timeAgo(blockTimeSec: number | null) {
  if (!blockTimeSec) return "—";
  const seconds = Date.now() / 1000 - blockTimeSec;
  if (seconds < 60) return `${Math.round(seconds)}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
  return `${Math.round(seconds / 86400)}d ago`;
}

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
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div>
        <Link href="/nft" className="text-xs text-ink-400 hover:text-ink-100">
          ← All collections
        </Link>
        <div className="mt-2 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold capitalize">{slug.replace(/-/g, " ")}</h1>
          <ExternalLinkBadge href={`https://magiceden.io/marketplace/${slug}`} label="Magic Eden" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Floor" value={stats.floorPrice !== null ? `${stats.floorPrice.toFixed(2)} SOL` : "—"} />
        <Stat label="Listed" value={stats.listedCount !== null ? stats.listedCount.toLocaleString() : "—"} />
        <Stat
          label="Avg (24h)"
          value={stats.avgPrice24h !== null ? `${stats.avgPrice24h.toFixed(2)} SOL` : "—"}
        />
        <Stat label="Volume (7d)" value={stats.volume7d !== null ? `${stats.volume7d.toFixed(0)} SOL` : "—"} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="mb-3 text-sm font-semibold">Listed NFTs</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {listings.map((l) => (
              <Link
                key={l.mintAddress}
                href={`/nft/${slug}/${l.mintAddress}`}
                className="flex flex-col overflow-hidden rounded-xl2 border border-line bg-surface hover:border-line-2"
              >
                <TokenIcon src={l.image} alt={l.name} className="aspect-square w-full" rounded={false} />
                <div className="flex flex-col gap-0.5 p-2.5">
                  <div className="truncate text-xs font-medium">{l.name}</div>
                  <div className="text-xs text-ink-300 tabular-nums">
                    {l.price !== null ? `${l.price.toFixed(2)} ${l.currency}` : "—"}
                  </div>
                </div>
              </Link>
            ))}
            {listings.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-ink-400">No active listings right now.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold">Recent Activity</h2>
          <p className="mb-2 text-xs text-ink-500">
            On-chain events, refreshed periodically — not a live tick-by-tick feed.
          </p>
          <ul className="flex flex-col divide-y divide-line rounded-xl2 border border-line bg-surface">
            {activity.map((a) => (
              <li key={a.signature} className="flex items-center justify-between px-3 py-2.5 text-xs">
                <span className="text-ink-300">{ACTIVITY_LABEL[a.type] ?? a.type}</span>
                <span className="tabular-nums">{a.price !== null ? `${a.price.toFixed(2)} ${a.currency}` : "—"}</span>
                <span className="text-ink-500">{timeAgo(a.blockTime)}</span>
              </li>
            ))}
            {activity.length === 0 && <li className="px-3 py-6 text-center text-ink-400">No recent activity.</li>}
          </ul>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl2 border border-line bg-surface p-3">
      <span className="text-[11px] uppercase tracking-wider text-ink-500">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}
