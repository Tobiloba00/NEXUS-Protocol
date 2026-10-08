// Shared shapes every data-source module normalizes into, so the poll route
// and cache tables don't need to know each upstream API's quirks.

/** Raw trading signals for a freshly listed DEX token — inputs to the risk
 * score (lib/risk/score.ts). Only dexscreener rows carry these. */
export type ListingSignals = {
  buys5m: number;
  sells5m: number;
  buys1h: number;
  sells1h: number;
  buys24h: number;
  sells24h: number;
  volume24hUsd: number | null;
  fdvUsd: number | null;
  change1hPct: number | null;
  hasSocials: boolean;
  hasWebsite: boolean;
};

export type Listing = {
  id: string; // stable key: coingecko coin id, or a dexscreener token address
  source: "coingecko" | "dexscreener";
  chain: string | null; // e.g. "solana", "ethereum" — dexscreener rows only
  symbol: string;
  name: string;
  image: string | null;
  priceUsd: number | null;
  change24hPct: number | null;
  marketCapUsd: number | null;
  liquidityUsd: number | null;
  pairCreatedAt: number | null; // epoch ms — dexscreener rows only
  link: string;
  signals?: ListingSignals; // dexscreener rows only; absent on older cached rows
  change7dPct?: number | null; // coingecko rows
  spark?: number[]; // coingecko rows: ~28 evenly spaced prices over 7 days, oldest first
};

export type NftCollection = {
  id: string; // lowercased name — dedup key, ported from legacy normalizeNFT (index.html:1332-1382)
  source: "magiceden" | "tensor";
  chain: string;
  name: string;
  image: string | null;
  floorPrice: number | null;
  currency: string;
  volume24h: number | null;
  volume7d: number | null; // native currency; used to rank active collections
  link: string;
  // Source's own collection identifier (Magic Eden's "symbol", e.g.
  // "degods") — needed to call per-collection listings/activity endpoints
  // for the /nft/[slug] detail page. Null for sources that don't expose
  // one (or aren't wired up to a detail page yet).
  slug: string | null;
};

/** One individually-listed NFT within a collection — /nft/[slug]'s grid,
 * not the collection-level card on /nft. Only Magic Eden is wired up to
 * this today. */
export type NftListing = {
  mintAddress: string;
  name: string;
  image: string | null;
  price: number | null; // in the collection's native currency (SOL for Magic Eden)
  currency: string;
  owner: string | null;
  attributes: { trait: string; value: string }[];
  link: string;
};

/** A sale/bid event from a collection's activity feed — polled, not
 * pushed, so it's labeled "recent activity" rather than claimed as
 * tick-level real-time (see the honesty note in nft-aggregate.ts). */
export type NftActivity = {
  signature: string;
  type: string; // e.g. "buyNow", "bid", "list" — passed through from the source, not normalized further
  price: number | null; // native currency (SOL) — not converted to USD, matching floor-price display elsewhere
  currency: string;
  blockTime: number | null; // epoch seconds
};

export type PredictionMarket = {
  slug: string;
  question: string;
  image: string | null;
  outcomes: { label: string; probability: number | null }[];
  volumeUsd: number | null;
  liquidityUsd: number | null;
  endDate: string | null;
  link: string;
};

/** Every fetcher follows this contract: never throw, return [] on failure,
 * so Promise.allSettled in the poll route never needs a catch per-source
 * (mirrors the legacy NFT aggregator's per-source try/catch, index.html:1263-1317). */
export type Fetcher<T> = () => Promise<T[]>;
