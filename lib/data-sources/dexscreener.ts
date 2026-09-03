import type { Listing } from "./types";

/**
 * DexScreener public API — keyless, confirmed working. Net-new for the
 * "new listings" module (the legacy repo never used DexScreener).
 *
 * /token-profiles/latest/v1 gives the newest tokens with a submitted
 * profile but no price data; /tokens/v1/{chain}/{address} (also keyless)
 * returns the actual pair with baseToken.symbol/name + priceUsd/marketCap,
 * confirmed via a real request during this rewrite. Each profile is
 * enriched with one follow-up call — fine at poll-route cadence (one
 * shared fetch per cycle for all visitors), would not be fine if any of
 * this ran per-visitor.
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

    const enriched = await Promise.allSettled(
      profiles.map((p) => enrichToken(p.chainId, p.tokenAddress))
    );
    return enriched
      .filter((r): r is PromiseFulfilledResult<Listing | null> => r.status === "fulfilled")
      .map((r) => r.value)
      .filter((v): v is Listing => v !== null);
  } catch (err) {
    console.warn("[dexscreener] token-profiles fetch failed", err);
    return [];
  }
}

async function enrichToken(chainId: string, address: string): Promise<Listing | null> {
  try {
    const res = await fetch(`${BASE}/tokens/v1/${chainId}/${address}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const pairs: DexPair[] = await res.json();
    const pair = pairs[0];
    if (!pair) return null;

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
  } catch {
    return null;
  }
}
