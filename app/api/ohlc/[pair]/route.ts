import { NextResponse } from "next/server";
import { fetchOhlc } from "@/lib/data-sources/coingecko";
import { getPairBySlug } from "@/lib/exchanges/pairs";

const RANGE_TO_DAYS: Record<string, number> = { "1d": 1, "1w": 7, "1m": 30, "1y": 365 };

/**
 * Backs the Overview dashboard's timeframe-switchable mini chart. Not
 * needed by /trade/[pair] (that page seeds server-side at build time and
 * layers live WS ticks on top) — this exists specifically so a client
 * component can refetch a different CoinGecko OHLC range on tab click
 * without a full page navigation.
 */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/ohlc/[pair]">
) {
  const { pair: slug } = await ctx.params;
  const pair = getPairBySlug(slug);
  if (!pair) return NextResponse.json({ ok: false, error: "unknown pair" }, { status: 404 });

  const range = new URL(request.url).searchParams.get("range") ?? "1d";
  const days = RANGE_TO_DAYS[range];
  if (!days) return NextResponse.json({ ok: false, error: "unknown range" }, { status: 400 });

  const candles = await fetchOhlc(pair.coingeckoId, days);
  return NextResponse.json({ ok: true, candles });
}
