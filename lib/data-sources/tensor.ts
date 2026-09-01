import type { NftCollection } from "./types";

/**
 * Tensor (Solana NFT marketplace). DISABLED BY DEFAULT for v1 — the legacy
 * repo's own comment already flagged "public read may require an api-key
 * header" (index.html:1295-1296) and sent no key. Confirmed during this
 * rewrite: api.tensor.so failed DNS resolution outright, and Tensor's
 * current docs (docs.tensor.so/consume/rest-api) describe a proper API
 * product, not a fully open endpoint. Per the build plan's pre-agreed
 * fallback, Magic Eden alone carries the NFT module for v1 — this file is
 * a ready-to-enable stub, not a missed deadline.
 *
 * To enable: get an API key from Tensor's developer docs, set
 * TENSOR_API_KEY, and wire this into lib/data-sources/nft-aggregate.ts's
 * source list.
 */

export async function fetchTensorCollections(_limit = 20): Promise<NftCollection[]> {
  if (!process.env.TENSOR_API_KEY) return [];

  try {
    const res = await fetch("https://api.tensor.so/graphql", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tensor-api-key": process.env.TENSOR_API_KEY,
      },
      body: JSON.stringify({
        query: `query TrendingCollections($limit: Int) {
          trendingCollections(limit: $limit) {
            name
            slug
            imageUri
            statsV2 { floorPrice }
          }
        }`,
        variables: { limit: _limit },
      }),
    });
    if (!res.ok) {
      console.warn(`[tensor] graphql ${res.status}`);
      return [];
    }
    const json = await res.json();
    const rows: Array<{
      name: string;
      slug: string;
      imageUri?: string;
      statsV2?: { floorPrice?: number };
    }> = json.data?.trendingCollections ?? [];

    return rows.map((r) => ({
      id: r.name.trim().toLowerCase(),
      source: "tensor" as const,
      chain: "solana",
      name: r.name,
      image: r.imageUri ?? null,
      floorPrice: typeof r.statsV2?.floorPrice === "number" ? r.statsV2.floorPrice / 1_000_000_000 : null,
      currency: "SOL",
      volume24h: null,
      link: `https://www.tensor.trade/trade/${r.slug}`,
    }));
  } catch (err) {
    console.warn("[tensor] graphql fetch failed", err);
    return [];
  }
}
