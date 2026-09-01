import type { NftCollection } from "./types";
import { fetchMagicEdenCollections } from "./magiceden";
import { fetchReservoirCollections } from "./reservoir";
import { fetchTensorCollections } from "./tensor";

/**
 * Fan-out + dedup, ported from legacy fetchAllNFTs (index.html:1388-1430).
 * Each source already returns [] on its own failure (never throws), so
 * Promise.allSettled here is a second layer of safety, not the only one —
 * matches the legacy aggregator's belt-and-suspenders resilience.
 *
 * Reservoir/Tensor return [] unless their API key env vars are set (see
 * their modules) — Magic Eden alone is what actually populates the NFT
 * module for v1, by design, not by accident.
 */
export async function fetchAllNftCollections(limit = 60): Promise<NftCollection[]> {
  const results = await Promise.allSettled([
    fetchMagicEdenCollections(limit),
    fetchReservoirCollections(limit),
    fetchTensorCollections(limit),
  ]);

  const rows = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  // Dedup by lowercased name, first-seen wins — same rule as legacy
  // index.html:1420-1427. Source order above (Magic Eden, Reservoir,
  // Tensor) is therefore also the tie-break priority.
  const seen = new Set<string>();
  const deduped: NftCollection[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    deduped.push(row);
  }

  return deduped.sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0));
}
