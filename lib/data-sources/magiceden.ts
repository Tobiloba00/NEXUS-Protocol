import type { NftActivity, NftCollection, NftListing } from "./types";

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
        slug: r.symbol,
      }));
  } catch (err) {
    console.warn("[magiceden] collections fetch failed", err);
    return [];
  }
}

type MagicEdenListing = {
  price: number; // SOL
  extra?: { img?: string };
  token: {
    mintAddress: string;
    name: string;
    image?: string;
    owner?: string;
    attributes?: { trait_type: string; value: string }[];
  };
};

/** Individually-listed NFTs within one collection, for /nft/[slug]'s grid.
 * Confirmed working against a real collection during this build — includes
 * real per-token images, attributes, and current owner (the seller), none
 * of which the collection-level /collections endpoint exposes. */
export async function fetchCollectionListings(slug: string, limit = 20): Promise<NftListing[]> {
  try {
    const res = await fetch(`${BASE}/collections/${slug}/listings?offset=0&limit=${limit}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      console.warn(`[magiceden] listings(${slug}) ${res.status}`);
      return [];
    }
    const rows: MagicEdenListing[] = await res.json();

    return rows.map((r) => ({
      mintAddress: r.token.mintAddress,
      name: r.token.name,
      image: r.token.image ?? r.extra?.img ?? null,
      price: typeof r.price === "number" ? r.price : null,
      currency: "SOL",
      owner: r.token.owner ?? null,
      attributes: (r.token.attributes ?? []).map((a) => ({ trait: a.trait_type, value: String(a.value) })),
      link: `https://magiceden.io/item-details/${r.token.mintAddress}`,
    }));
  } catch (err) {
    console.warn(`[magiceden] listings(${slug}) fetch failed`, err);
    return [];
  }
}

type MagicEdenStats = {
  floorPrice?: number; // lamports
  listedCount?: number;
  avgPrice24hr?: number; // lamports
  volume7d?: number; // lamports
};

export type CollectionStats = {
  floorPrice: number | null;
  listedCount: number | null;
  avgPrice24h: number | null;
  volume7d: number | null;
};

export async function fetchCollectionStats(slug: string): Promise<CollectionStats> {
  try {
    const res = await fetch(`${BASE}/collections/${slug}/stats`, { headers: { accept: "application/json" } });
    if (!res.ok) return { floorPrice: null, listedCount: null, avgPrice24h: null, volume7d: null };
    const s: MagicEdenStats = await res.json();
    return {
      floorPrice: typeof s.floorPrice === "number" ? s.floorPrice / LAMPORTS_PER_SOL : null,
      listedCount: s.listedCount ?? null,
      avgPrice24h: typeof s.avgPrice24hr === "number" ? s.avgPrice24hr / LAMPORTS_PER_SOL : null,
      volume7d: typeof s.volume7d === "number" ? s.volume7d / LAMPORTS_PER_SOL : null,
    };
  } catch (err) {
    console.warn(`[magiceden] stats(${slug}) fetch failed`, err);
    return { floorPrice: null, listedCount: null, avgPrice24h: null, volume7d: null };
  }
}

export type TokenDetail = {
  mintAddress: string;
  name: string;
  image: string | null;
  collectionName: string | null;
  collectionSlug: string | null;
  owner: string | null;
  attributes: { trait: string; value: string }[];
};

/** Single-token lookup, confirmed working — used for /nft/[slug]/[mint]'s
 * detail page. Gives metadata (name, image, attributes, owner) but not a
 * current listing price (that's a marketplace-listing fact, not a token
 * fact — a delisted/sold token still resolves here with no price to show,
 * which is correct, not a bug: the page links out to Magic Eden itself for
 * the live listing rather than guessing at a price). */
export async function fetchTokenDetail(mintAddress: string): Promise<TokenDetail | null> {
  try {
    const res = await fetch(`${BASE}/tokens/${mintAddress}`, { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    const t = await res.json();
    return {
      mintAddress: t.mintAddress,
      name: t.name,
      image: t.image ?? null,
      collectionName: t.collectionName ?? null,
      collectionSlug: t.collection ?? null,
      owner: t.owner ?? null,
      attributes: (t.attributes ?? []).map((a: { trait_type: string; value: unknown }) => ({
        trait: a.trait_type,
        value: String(a.value),
      })),
    };
  } catch (err) {
    console.warn(`[magiceden] token(${mintAddress}) fetch failed`, err);
    return null;
  }
}

type MagicEdenActivity = {
  signature: string;
  type: string;
  price?: number; // SOL
  blockTime?: number;
};

/**
 * Sale/bid/listing history — confirmed working against a real collection.
 * Polled at page-load/revalidation cadence, not pushed, so this is labeled
 * "recent activity" in the UI, never claimed as tick-level live — floor
 * price and individual sales are fundamentally different kinds of "real
 * time" (a sale is a discrete on-chain event; a floor is a derived,
 * indexed marketplace metric), and conflating them would be exactly the
 * kind of overclaim this product has been fixing elsewhere.
 */
export async function fetchCollectionActivity(slug: string, limit = 15): Promise<NftActivity[]> {
  try {
    const res = await fetch(`${BASE}/collections/${slug}/activities?offset=0&limit=${limit}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      console.warn(`[magiceden] activities(${slug}) ${res.status}`);
      return [];
    }
    const rows: MagicEdenActivity[] = await res.json();
    return rows.map((r) => ({
      signature: r.signature,
      type: r.type,
      price: typeof r.price === "number" ? r.price : null,
      currency: "SOL",
      blockTime: r.blockTime ?? null,
    }));
  } catch (err) {
    console.warn(`[magiceden] activities(${slug}) fetch failed`, err);
    return [];
  }
}
