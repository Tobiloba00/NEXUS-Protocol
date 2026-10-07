import { getSupabaseServerClient } from "@/lib/supabase/server";
import { fetchTopMarkets } from "@/lib/data-sources/coingecko";
import { fetchNewTokenProfiles } from "@/lib/data-sources/dexscreener";
import { fetchAllNftCollections } from "@/lib/data-sources/nft-aggregate";
import { fetchActiveMarkets } from "@/lib/data-sources/polymarket";
import type { Listing, NftCollection, PredictionMarket } from "@/lib/data-sources/types";

/**
 * Cache-first reads for every page. Visitors never trigger an upstream API
 * call when the Supabase cache has data: only the poller (app/api/internal/
 * poll/route.ts) talks to upstream, on its own schedule. That keeps a
 * traffic spike (or a Google crawl) from burning free-tier quotas, and it
 * means an upstream outage or rate limit just leaves the last good data
 * on screen instead of an empty page.
 *
 * Falls back to a live fetch only when the cache is unavailable or empty
 * (local dev with no Supabase env vars, or the very first deploy before the
 * poller has run once).
 */

export type Cached<T> = {
  data: T[];
  /** When the poller last wrote this data, or null if it came from a live fallback. */
  fetchedAt: string | null;
  from: "cache" | "live";
};

type CacheTable = "listings_cache" | "nft_cache" | "prediction_markets_cache";

// Rows from one poll cycle share an identical fetched_at, and the poller
// stamps each row's position as `rank`. Reading only the newest batch drops
// rows from older cycles (e.g. a coin that left the top 100) and keeps the
// source's own ordering.
async function readLatestBatch<T>(
  table: CacheTable,
  opts: { source?: string; scan?: number }
): Promise<{ rows: T[]; fetchedAt: string } | null> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    let query = getSupabaseServerClient()
      .from(table)
      .select("data, fetched_at")
      .order("fetched_at", { ascending: false })
      .limit(opts.scan ?? 200);
    if (opts.source) query = query.eq("source", opts.source);

    const { data, error } = await query;
    if (error || !data?.length) {
      if (error) console.warn(`[cache] ${table} read failed`, error.message);
      return null;
    }

    const latest = data[0].fetched_at as string;
    const rows = data.filter((r) => r.fetched_at === latest).map((r) => r.data as T & { rank?: number });
    rows.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
    return { rows, fetchedAt: latest };
  } catch (err) {
    console.warn(`[cache] ${table} read threw`, err);
    return null;
  }
}

export async function getMarkets(limit = 100): Promise<Cached<Listing>> {
  const hit = await readLatestBatch<Listing>("listings_cache", { source: "coingecko" });
  if (hit) return { data: hit.rows.slice(0, limit), fetchedAt: hit.fetchedAt, from: "cache" };
  return { data: await fetchTopMarkets(limit), fetchedAt: null, from: "live" };
}

export async function getNewListings(limit = 30): Promise<Cached<Listing>> {
  const hit = await readLatestBatch<Listing>("listings_cache", { source: "dexscreener" });
  if (hit) {
    const newestFirst = [...hit.rows].sort((a, b) => (b.pairCreatedAt ?? 0) - (a.pairCreatedAt ?? 0));
    return { data: newestFirst.slice(0, limit), fetchedAt: hit.fetchedAt, from: "cache" };
  }
  return { data: await fetchNewTokenProfiles(limit), fetchedAt: null, from: "live" };
}

export async function getNftCollections(limit = 40): Promise<Cached<NftCollection>> {
  const hit = await readLatestBatch<NftCollection>("nft_cache", {});
  if (hit) return { data: hit.rows.slice(0, limit), fetchedAt: hit.fetchedAt, from: "cache" };
  return { data: await fetchAllNftCollections(limit), fetchedAt: null, from: "live" };
}

export async function getPredictionMarkets(limit = 40): Promise<Cached<PredictionMarket>> {
  const hit = await readLatestBatch<PredictionMarket>("prediction_markets_cache", {});
  if (hit) return { data: hit.rows.slice(0, limit), fetchedAt: hit.fetchedAt, from: "cache" };
  return { data: await fetchActiveMarkets(limit), fetchedAt: null, from: "live" };
}
