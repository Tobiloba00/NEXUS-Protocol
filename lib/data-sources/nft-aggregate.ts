import type { NftCollection } from "./types";
import { fetchMagicEdenCollections } from "./magiceden";
import { fetchTensorCollections } from "./tensor";

/**
 * Fan-out + dedup, ported from legacy fetchAllNFTs (index.html:1388-1430).
 * Each source already returns [] on its own failure (never throws), so
 * Promise.allSettled here is a second layer of safety, not the only one —
 * matches the legacy aggregator's belt-and-suspenders resilience.
 *
 * Tensor returns [] unless TENSOR_API_KEY is set — Magic Eden (Solana only)
 * is what actually populates the NFT module today. Reservoir was removed:
 * it shut down its NFT API on 2025-10-15. Ethereum/EVM coverage is the next
 * source to add here (one adapter file returning NftCollection[]).
 */
export async function fetchAllNftCollections(limit = 60): Promise<NftCollection[]> {
  const results = await Promise.allSettled([
    fetchMagicEdenCollections(limit),
    fetchTensorCollections(limit),
  ]);

  const rows = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  // Dedup by lowercased name, first-seen wins — same rule as legacy
  // index.html:1420-1427. Source order above (Magic Eden, Tensor) is
  // therefore also the tie-break priority.
  const seen = new Set<string>();
  const deduped: NftCollection[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    deduped.push(row);
  }

  return deduped.sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0));
}
