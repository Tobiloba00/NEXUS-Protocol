"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Segmented } from "@/components/ui/Segmented";
import { LiveStatusChip } from "@/components/status/LiveStatusChip";
import { usePolled } from "@/lib/live/usePolled";
import type { NftCollection } from "@/lib/data-sources/types";

const REFRESH_MS = 60000;

// Magic Eden has no CORS headers, so the browser refreshes via our own
// CDN-cached route (app/api/live/nft/route.ts) instead of calling it directly.
async function fetchFreshCollections(): Promise<NftCollection[]> {
  const res = await fetch("/api/live/nft");
  const json = await res.json();
  if (!res.ok || !json.collections?.length) throw new Error("no collections returned");
  return json.collections;
}

const CHAIN_LABEL: Record<string, string> = { solana: "Solana", ethereum: "Ethereum", polygon: "Polygon" };

function Tile({ c }: { c: NftCollection }) {
  const [broken, setBroken] = useState(false);
  const body = (
    <>
      <div className="overflow-hidden rounded-[20px] bg-surface-2">
        {c.image && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element -- sources span many CDNs
          <img
            src={c.image}
            alt=""
            loading="lazy"
            onError={() => setBroken(true)}
            className="aspect-square w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center text-[28px] font-semibold tracking-tight text-ink-500">
            {c.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="mt-2.5 min-w-0 px-0.5">
        <div className="truncate text-[15px] font-semibold tracking-[-0.015em]">{c.name}</div>
        <div className="mt-0.5 flex items-baseline gap-1 text-[13px] text-ink-400">
          {c.floorPrice !== null ? (
            <>
              <span className="font-medium tabular-nums text-ink-200">{c.floorPrice.toLocaleString("en-US", { maximumFractionDigits: c.floorPrice < 1 ? 3 : c.floorPrice < 10 ? 2 : 1 })}</span>
              {c.currency}
              <span className="text-ink-500">floor</span>
            </>
          ) : (
            "Floor unavailable"
          )}
        </div>
      </div>
    </>
  );

  return c.slug ? (
    <Link href={`/nft/${c.slug}`} className="press group block">
      {body}
    </Link>
  ) : (
    <a href={c.link} target="_blank" rel="noopener noreferrer" className="press group block">
      {body}
    </a>
  );
}

export function NftGrid({ collections: initial }: { collections: NftCollection[] }) {
  const { data: collections, status } = usePolled(fetchFreshCollections, initial, REFRESH_MS);
  const [chain, setChain] = useState("all");

  const chains = useMemo(() => Array.from(new Set(collections.map((c) => c.chain))), [collections]);
  const filtered = chain === "all" ? collections : collections.filter((c) => c.chain === chain);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {chains.length > 1 ? (
          <Segmented
            ariaLabel="Chain"
            value={chain}
            onChange={setChain}
            options={[{ value: "all", label: "All" }, ...chains.map((c) => ({ value: c, label: CHAIN_LABEL[c] ?? c }))]}
          />
        ) : (
          <span />
        )}
        <LiveStatusChip status={status} source="Magic Eden · every minute" />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4">
        {filtered.map((c) => (
          <Tile key={c.id} c={c} />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-12 text-center text-[15px] text-ink-400">No collections right now.</p>
        )}
      </div>
    </div>
  );
}
