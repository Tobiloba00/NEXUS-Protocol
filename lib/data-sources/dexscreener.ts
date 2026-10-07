import type { Listing } from "./types";

/**
 * DexScreener public API — keyless, confirmed working. Net-new for the
 * "new listings" module (the legacy repo never used DexScreener).
 *
 * /token-profiles/latest/v1 gives the newest tokens with a submitted
 * profile but no price data; /tokens/v1/{chain}/{address} (also keyless)
 * returns the actual pair with baseToken.symbol/name + priceUsd/marketCap,
 * confirmed via a real request during this rewrite. Profiles are enriched
 * in per-chain batches (see fetchTokenBatch). Sends CORS headers, so this
 * module runs both server-side (poller) and in visitors' browsers (live
 * refresh in components/listings/ListingsTable.tsx).
 */

const BASE = "https://api.dexscreener.com";

type TokenProfile = {
  chainId: string;
  tokenAddress: string;
};

type DexPair = {
  baseToken: { address: string; name: string; symbol: string };
  priceUsd?: string;
  priceChange?: { h24?: number };
  marketCap?: number;
  fdv?: number;
  liquidity?: { usd?: number };
  pairCreatedAt?: number;
  info?: { imageUrl?: string };
};

export async function fetchNewTokenProfiles(limit = 20): Promise<Listing[]> {
  try {
    const res = await fetch(`${BASE}/token-profiles/latest/v1`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      console.warn(`[dexscreener] token-profiles ${res.status}`);
      return [];
    }
    const profiles: TokenProfile[] = (await res.json()).slice(0, limit);

    // One request per (chain, up-to-30 addresses) instead of one per token:
    // ~5 calls for 30 listings rather than 31. Matters because this same
    // function now also runs in visitors' browsers (live refresh), where the
    // DexScreener rate limit is per visitor IP.
    const byChain = new Map<string, string[]>();
    for (const p of profiles) {
      const list = byChain.get(p.chainId) ?? [];
      list.push(p.tokenAddress);
      byChain.set(p.chainId, list);
    }
    const requests: Promise<Map<string, DexPair>>[] = [];
    for (const [chainId, addresses] of byChain) {
      for (let i = 0; i < addresses.length; i += MAX_ADDRESSES_PER_CALL) {
        requests.push(fetchTokenBatch(chainId, addresses.slice(i, i + MAX_ADDRESSES_PER_CALL)));
      }
    }
    const pairByToken = new Map<string, DexPair>();
    for (const r of await Promise.allSettled(requests)) {
      if (r.status === "fulfilled") for (const [k, v] of r.value) pairByToken.set(k, v);
    }

    // Keep the profile feed's own order (newest first).
    return profiles
      .map((p) => {
        const pair = pairByToken.get(`${p.chainId}:${p.tokenAddress.toLowerCase()}`);
        return pair ? toListing(p.chainId, p.tokenAddress, pair) : null;
      })
      .filter((v): v is Listing => v !== null);
  } catch (err) {
    console.warn("[dexscreener] token-profiles fetch failed", err);
    return [];
  }
}

const MAX_ADDRESSES_PER_CALL = 30; // DexScreener's documented cap for /tokens/v1

/** Best (most liquid) pair per token, keyed by `${chain}:${lowercased address}`. */
async function fetchTokenBatch(chainId: string, addresses: string[]): Promise<Map<string, DexPair>> {
  const best = new Map<string, DexPair>();
  try {
    const res = await fetch(`${BASE}/tokens/v1/${chainId}/${addresses.join(",")}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return best;
    const pairs: DexPair[] = await res.json();
    for (const pair of pairs) {
      const key = `${chainId}:${pair.baseToken.address.toLowerCase()}`;
      const current = best.get(key);
      if (!current || (pair.liquidity?.usd ?? 0) > (current.liquidity?.usd ?? 0)) best.set(key, pair);
    }
  } catch {
    // a failed batch just leaves its tokens out of this refresh
  }
  return best;
}

function toListing(chainId: string, address: string, pair: DexPair): Listing {
  return {
    id: `${chainId}:${address}`,
    source: "dexscreener",
    chain: chainId,
    symbol: pair.baseToken.symbol,
    name: pair.baseToken.name,
    image: pair.info?.imageUrl ?? null,
    priceUsd: pair.priceUsd ? Number(pair.priceUsd) : null,
    change24hPct: pair.priceChange?.h24 ?? null,
    marketCapUsd: pair.marketCap ?? pair.fdv ?? null,
    liquidityUsd: pair.liquidity?.usd ?? null,
    pairCreatedAt: pair.pairCreatedAt ?? null,
    link: `https://dexscreener.com/${chainId}/${address}`,
  };
}
