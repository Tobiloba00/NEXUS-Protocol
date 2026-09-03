"use client";

import { useMemo, useState } from "react";
import { ExternalLinkBadge } from "@/components/ui/ExternalLinkBadge";
import type { NftCollection } from "@/lib/data-sources/types";

const CHAIN_LABEL: Record<string, string> = { solana: "Solana", ethereum: "Ethereum", polygon: "Polygon" };
const SOURCE_LABEL: Record<string, string> = { magiceden: "Magic Eden", reservoir: "Reservoir", tensor: "Tensor" };

export function NftGrid({ collections }: { collections: NftCollection[] }) {
  const [chain, setChain] = useState("all");

  const chains = useMemo(() => Array.from(new Set(collections.map((c) => c.chain))), [collections]);
  const filtered = chain === "all" ? collections : collections.filter((c) => c.chain === chain);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5 overflow-x-auto rounded-lg bg-surface-2 p-1">
        <button
          onClick={() => setChain("all")}
          className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium ${
            chain === "all" ? "bg-surface text-ink-50 shadow-[var(--shadow-card)]" : "text-ink-400"
          }`}
        >
          All Chains
        </button>
        {chains.map((c) => (
          <button
            key={c}
            onClick={() => setChain(c)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium ${
              chain === c ? "bg-surface text-ink-50 shadow-[var(--shadow-card)]" : "text-ink-400"
            }`}
          >
            {CHAIN_LABEL[c] ?? c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((c) => (
          <div key={c.id} className="flex flex-col overflow-hidden rounded-xl2 border border-line bg-surface">
            {c.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- sources span many CDNs
              <img src={c.image} alt="" className="aspect-square w-full bg-surface-2 object-cover" />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-surface-2 text-xs text-ink-500">
                No image
              </div>
            )}
            <div className="flex flex-col gap-1 p-3">
              <div className="truncate text-sm font-medium">{c.name}</div>
              <div className="text-xs text-ink-400">
                Floor {c.floorPrice !== null ? `${c.floorPrice.toFixed(2)} ${c.currency}` : "—"}
              </div>
              <div className="mt-1">
                <ExternalLinkBadge href={c.link} label={SOURCE_LABEL[c.source] ?? c.source} />
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-ink-400">
            No collections for this chain right now.
          </p>
        )}
      </div>
    </div>
  );
}
