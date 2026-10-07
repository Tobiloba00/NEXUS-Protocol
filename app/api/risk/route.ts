import { NextRequest, NextResponse } from "next/server";
import { fetchSecurityReport, isValidTarget, SUPPORTED_CHAINS } from "@/lib/risk/goplus";

/**
 * On-demand token security scan (GoPlus), proxied so every visitor shares one
 * CDN-cached answer per token for 15 minutes — GoPlus's free limits are never
 * touched by traffic, only by distinct tokens people actually look at.
 * Input is strictly validated (known chain + address shape) before any
 * upstream call is made.
 */
export async function GET(request: NextRequest) {
  const chain = request.nextUrl.searchParams.get("chain") ?? "";
  const address = request.nextUrl.searchParams.get("address") ?? "";

  if (!SUPPORTED_CHAINS.includes(chain)) {
    return NextResponse.json({ ok: false, reason: "unsupported-chain" }, { status: 200, headers: { "Cache-Control": "public, s-maxage=3600" } });
  }
  if (!isValidTarget(chain, address)) {
    return NextResponse.json({ ok: false, reason: "bad-address" }, { status: 400 });
  }

  try {
    const report = await fetchSecurityReport(chain, address);
    if (!report) {
      // Brand-new tokens often aren't indexed yet — retry sooner than a full report.
      return NextResponse.json(
        { ok: false, reason: "not-indexed" },
        { headers: { "Cache-Control": "public, s-maxage=120" } }
      );
    }
    return NextResponse.json(
      { ok: true, report },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } }
    );
  } catch (err) {
    console.warn("[risk] scan failed", err);
    return NextResponse.json({ ok: false, reason: "upstream-error" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
