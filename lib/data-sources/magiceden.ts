import type { NftCollection } from "./types";

/**
 * Magic Eden (Solana) — keyless, confirmed working during this rewrite.
 * Ported from legacy/index.html:1263-1273. limit must be a multiple of 20
 * per Magic Eden's own pagination requirement (same constraint noted in
 * the legacy comment).
 */

const BASE = "https://api-mainnet.magiceden.dev/v2";

type MagicEdenCollection = {
  symbol: string;
  name: string;
  image?: string;
  floorPrice?: number; // lamports
  volumeAll?: number; // lamports
};

const LAMPORTS_PER_SOL = 1_000_000_000;

export async function fetchMagicEdenCollections(limit = 60): Promise<NftCollection[]> {
  try {
    const res = await fetch(`${BASE}/collections?offset=0&limit=${limit}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      console.warn(`[magiceden] collections ${res.status}`);
      return [];
    }
    const rows: MagicEdenCollection[] = await res.json();

    return rows
      .filter((r) => r.name && r.image)
      .map((r) => ({
        id: r.name.trim().toLowerCase(),
        source: "magiceden" as const,
        chain: "solana",
        name: r.name,
        image: r.image ?? null,
        floorPrice: typeof r.floorPrice === "number" ? r.floorPrice / LAMPORTS_PER_SOL : null,
        currency: "SOL",
        // No true 24h volume field on this endpoint — volumeAll is
        // lifetime, not daily. Flagged honestly rather than guessed at
        // (the legacy repo's `* 0.1` heuristic, index.html:1349, is not
        // ported forward — a wrong-looking real number is worse than none).
        volume24h: null,
        link: `https://magiceden.io/marketplace/${r.symbol}`,
      }));
  } catch (err) {
    console.warn("[magiceden] collections fetch failed", err);
    return [];
  }
}
