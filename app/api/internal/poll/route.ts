import { NextRequest, NextResponse } from "next/server";
import { fetchTopMarkets } from "@/lib/data-sources/coingecko";
import { fetchNewTokenProfiles } from "@/lib/data-sources/dexscreener";
import { fetchAllNftCollections } from "@/lib/data-sources/nft-aggregate";
import { fetchActiveMarkets } from "@/lib/data-sources/polymarket";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { evaluatePriceAlerts } from "@/lib/alerts/evaluate";

/**
 * The one route GitHub Actions calls on a schedule (.github/workflows/poller.yml).
 * Fetches every upstream source in parallel (Promise.allSettled — one dead
 * source never sinks the others, same resilience shape as the legacy NFT
 * aggregator) and upserts normalized rows into the Supabase cache tables
 * from supabase/migrations/0001_init.sql. ISR pages read those tables, not
 * the upstream APIs, so traffic never scales upstream API usage.
 *
 * Also evaluates price-threshold alert rules against the fresh CoinGecko
 * data (lib/alerts/evaluate.ts) and sends any that crossed via Telegram.
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const expected = process.env.POLL_SECRET;

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "POLL_SECRET is not configured on the server" },
      { status: 500 }
    );
  }
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const [markets, listings, nfts, predictions] = await Promise.all([
    fetchTopMarkets(100),
    fetchNewTokenProfiles(20),
    fetchAllNftCollections(60),
    fetchActiveMarkets(50),
  ]);

  const summary = {
    coingecko_markets: markets.length,
    dexscreener_listings: listings.length,
    nft_collections: nfts.length,
    prediction_markets: predictions.length,
  };

  let dbWrite: "ok" | "skipped" | "failed" = "skipped";
  let dbError: string | null = null;
  let alerts: { evaluated: number; fired: number } | "skipped" = "skipped";

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = getSupabaseServerClient();
      const fetchedAt = new Date().toISOString();

      await Promise.all([
        markets.length &&
          supabase.from("listings_cache").upsert(
            markets.map((m) => ({
              id: m.id,
              source: m.source,
              symbol: m.symbol,
              name: m.name,
              data: m,
              fetched_at: fetchedAt,
            }))
          ),
        listings.length &&
          supabase.from("listings_cache").upsert(
            listings.map((l) => ({
              id: l.id,
              source: l.source,
              symbol: l.symbol,
              name: l.name,
              data: l,
              fetched_at: fetchedAt,
            }))
          ),
        nfts.length &&
          supabase.from("nft_cache").upsert(
            nfts.map((n) => ({
              id: n.id,
              source: n.source,
              chain: n.chain,
              name: n.name,
              data: n,
              fetched_at: fetchedAt,
            }))
          ),
        predictions.length &&
          supabase.from("prediction_markets_cache").upsert(
            predictions.map((p) => ({
              slug: p.slug,
              question: p.question,
              data: p,
              fetched_at: fetchedAt,
            }))
          ),
      ]);
      dbWrite = "ok";

      // Runs after the cache writes so a rule that just fires reads the
      // same fresh prices ISR pages will also see next request.
      alerts = await evaluatePriceAlerts(markets);
    } catch (err) {
      dbWrite = "failed";
      dbError = err instanceof Error ? err.message : String(err);
      console.error("[poll] Supabase write failed", err);
    }
  }

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    sources: summary,
    dbWrite,
    dbError,
    alerts,
  });
}
