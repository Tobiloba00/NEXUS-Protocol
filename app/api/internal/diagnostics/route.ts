import { NextResponse } from "next/server";

/**
 * One-off reachability check, not a permanent feature: confirms whether
 * Vercel's servers can reach Binance/Bybit's REST APIs before committing
 * historical chart data to them. My own dev sandbox can't reach either
 * domain at all (DNS-level block on exchange-trading domains specifically —
 * CoinGecko/DexScreener resolve fine from the same shell), so this can't be
 * verified locally; Vercel's network is a different egress path entirely,
 * with real precedent in this build (Reservoir, Tensor) for exchange/data
 * APIs blocking cloud-provider IPs specifically. Delete once the historical-
 * klines decision is settled either way.
 */
export async function GET() {
  const checks = await Promise.allSettled([
    fetch("https://api.binance.com/api/v3/ping").then((r) => ({ ok: r.ok, status: r.status })),
    fetch("https://api.bybit.com/v5/market/time").then((r) => ({ ok: r.ok, status: r.status })),
  ]);

  return NextResponse.json({
    binance: checks[0].status === "fulfilled" ? checks[0].value : { error: String(checks[0].reason) },
    bybit: checks[1].status === "fulfilled" ? checks[1].value : { error: String(checks[1].reason) },
  });
}
