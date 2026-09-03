import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { LAUNCH_PAIRS } from "@/lib/exchanges/pairs";

/**
 * Tier-3 price fallback for useLiveTicker: if a visitor's network blocks
 * BOTH Binance's and Bybit's WebSocket domains outright (a real, confirmed-
 * possible failure mode — some networks/regions filter exchange domains
 * broadly, not just Binance specifically), there was previously nothing
 * left to fall back to and the ticker sat on "Sample data" forever. This
 * route reads the price the poll route already cached in Supabase (refreshed
 * every ~5 min) — client polls it every 15s as a last resort, never hits
 * CoinGecko directly, so it costs nothing extra upstream no matter how many
 * visitors fall back to it.
 */
export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/price/[symbol]">
) {
  const { symbol } = await ctx.params;
  const pair = LAUNCH_PAIRS.find((p) => p.binanceSymbol.toLowerCase() === symbol.toLowerCase());
  if (!pair) return NextResponse.json({ ok: false, error: "unknown symbol" }, { status: 404 });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: "cache not configured" }, { status: 503 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("listings_cache")
      .select("data, fetched_at")
      .eq("id", pair.coingeckoId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ ok: false, error: "no cached price yet" }, { status: 404 });
    }

    const listing = data.data as { priceUsd: number | null; change24hPct: number | null };
    return NextResponse.json({
      ok: true,
      priceUsd: listing.priceUsd,
      change24hPct: listing.change24hPct,
      fetchedAt: data.fetched_at,
    });
  } catch (err) {
    console.warn("[api/price] lookup failed", err);
    return NextResponse.json({ ok: false, error: "lookup failed" }, { status: 500 });
  }
}
