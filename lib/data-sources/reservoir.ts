import type { NftCollection } from "./types";

/**
 * Reservoir (EVM NFT aggregator). DISABLED BY DEFAULT for v1 — per the
 * build plan's pre-agreed fallback. During this rewrite, api.reservoir.tools
 * failed outright (DNS resolution failure) and Reservoir's current docs
 * live under nft.reservoir.tools with a Developer Dashboard signup flow,
 * suggesting the free keyless access the legacy repo's code assumed
 * (index.html:1276-1290, "free 10K/day") no longer holds as simply as
 * written. Not confirmed dead — just not confirmed free/keyless anymore.
 *
 * To enable: get an API key from the Reservoir/nft.reservoir.tools
 * dashboard, set RESERVOIR_API_KEY, and wire this into
 * lib/data-sources/nft-aggregate.ts's source list.
 */

export async function fetchReservoirCollections(_limit = 20): Promise<NftCollection[]> {
  if (!process.env.RESERVOIR_API_KEY) return [];

  try {
    const res = await fetch(`https://api.reservoir.tools/collections/trending/v1?limit=${_limit}`, {
      headers: {
        accept: "application/json",
        "x-api-key": process.env.RESERVOIR_API_KEY,
      },
    });
    if (!res.ok) {
      console.warn(`[reservoir] collections ${res.status}`);
      return [];
    }
    const json = await res.json();
    const rows: Array<{
      id: string;
      name: string;
      image?: string;
      floorAsk?: { price?: { amount?: { native?: number } } };
      volume?: { "1day"?: number };
    }> = json.collections ?? [];

    return rows.map((r) => ({
      id: r.name.trim().toLowerCase(),
      source: "reservoir" as const,
      chain: "ethereum",
      name: r.name,
      image: r.image ?? null,
      floorPrice: r.floorAsk?.price?.amount?.native ?? null,
      currency: "ETH",
      volume24h: r.volume?.["1day"] ?? null,
      link: `https://opensea.io/collection/${r.id}`,
    }));
  } catch (err) {
    console.warn("[reservoir] collections fetch failed", err);
    return [];
  }
}
