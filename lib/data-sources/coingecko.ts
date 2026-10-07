import type { Listing } from "./types";

/**
 * CoinGecko free tier. Confirmed working keyless: /coins/markets and
 * /coins/{id}/ohlc. NOT confirmed: the legacy repo (index.html:810-811)
 * assumed a "recently added coins" endpoint existed on the free tier — as
 * of this rewrite, /coins/list/new returns 401 "PRO API subscribers only".
 * So CoinGecko now only supplies established-coin market data here; the
 * "new listings" module leans on DexScreener instead (see dexscreener.ts).
 *
 * Server-only — called exclusively from app/api/internal/poll/route.ts,
 * never per-visitor, to stay well under the free/Demo rate limit
 * (~30 calls/min) regardless of site traffic.
 */

const BASE = "https://api.coingecko.com/api/v3";

// Free Demo plan = 10,000 credits/month, non-commercial, attribution
// required (coingecko.com/en/api/pricing). Set COINGECKO_API_KEY to send the
// Demo key; without it requests go through the keyless public tier.
function headers(): Record<string, string> {
  const key = process.env.COINGECKO_API_KEY;
  return key ? { accept: "application/json", "x-cg-demo-api-key": key } : { accept: "application/json" };
}

export async function fetchTopMarkets(perPage = 100): Promise<Listing[]> {
  try {
    const res = await fetch(
      `${BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=false&price_change_percentage=24h`,
      { headers: headers(), cache: "no-store" }
    );
    if (!res.ok) {
      console.warn(`[coingecko] markets ${res.status}${res.status === 429 ? " (rate limited / quota exhausted)" : ""}`);
      return [];
    }
    const rows: Array<{
      id: string;
      symbol: string;
      name: string;
      image?: string;
      current_price: number | null;
      price_change_percentage_24h: number | null;
      market_cap: number | null;
    }> = await res.json();

    return rows.map((r) => ({
      id: r.id,
      source: "coingecko" as const,
      chain: null,
      symbol: r.symbol.toUpperCase(),
      name: r.name,
      image: r.image ?? null,
      priceUsd: r.current_price,
      change24hPct: r.price_change_percentage_24h,
      marketCapUsd: r.market_cap,
      liquidityUsd: null,
      pairCreatedAt: null,
      link: `https://www.coingecko.com/en/coins/${r.id}`,
    }));
  } catch (err) {
    console.warn("[coingecko] markets fetch failed", err);
    return [];
  }
}

/** OHLC candles for seeding a chart's initial view before the live WS ticks
 * take over (see lib/exchanges — Days 5-6). days: 1|7|14|30|90|180|365. */
export async function fetchOhlc(coinId: string, days: number = 1): Promise<[number, number, number, number, number][]> {
  try {
    // Cached in Next's data cache so page regenerations and chart range
    // clicks share one upstream call per (coin, range) instead of one each.
    // Seeds only: the live WebSocket layers on top, so an hour-old 1d seed is fine.
    const res = await fetch(`${BASE}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`, {
      headers: headers(),
      next: { revalidate: days <= 1 ? 3600 : 21600 },
    });
    if (!res.ok) {
      console.warn(`[coingecko] ohlc(${coinId}) ${res.status}`);
      return [];
    }
    return await res.json();
  } catch (err) {
    console.warn(`[coingecko] ohlc(${coinId}) failed`, err);
    return [];
  }
}
