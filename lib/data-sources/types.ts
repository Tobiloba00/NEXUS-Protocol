// Shared shapes every data-source module normalizes into, so the poll route
// and cache tables don't need to know each upstream API's quirks.

export type Listing = {
  id: string; // stable key: coingecko coin id, or a dexscreener token address
  source: "coingecko" | "dexscreener";
  symbol: string;
  name: string;
  priceUsd: number | null;
  change24hPct: number | null;
  marketCapUsd: number | null;
  link: string;
};

export type NftCollection = {
  id: string; // lowercased name — dedup key, ported from legacy normalizeNFT (index.html:1332-1382)
  source: "magiceden" | "reservoir" | "tensor";
  chain: string;
  name: string;
  image: string | null;
  floorPrice: number | null;
  currency: string;
  volume24h: number | null;
  link: string;
};

export type PredictionMarket = {
  slug: string;
  question: string;
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
