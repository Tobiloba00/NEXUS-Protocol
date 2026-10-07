import { NextResponse } from "next/server";
import { fetchAllNftCollections } from "@/lib/data-sources/nft-aggregate";
import { getNftCollections } from "@/lib/data/cache";

/**
 * Live NFT floors for the browser. Magic Eden doesn't send CORS headers, so
 * visitors can't call it directly the way they call DexScreener/Polymarket —
 * this route is the bridge. The Cache-Control header lets Vercel's CDN
 * answer every visitor from one shared copy for 20s (then serve-stale while
 * refreshing), so upstream sees ~3 calls/minute no matter how many people
 * are watching (Magic Eden allows 120/min per IP).
 *
 * If the upstream returns nothing (down / rate limited), fall back to the
 * last good Supabase snapshot rather than an empty list.
 */
export async function GET() {
  let collections = await fetchAllNftCollections(40);
  let from: "live" | "cache" = "live";

  if (!collections.length) {
    const cached = await getNftCollections(40);
    collections = cached.data;
    from = "cache";
  }

  if (!collections.length) {
    return NextResponse.json({ ok: false, collections: [] }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(
    { ok: true, from, collections },
    { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60" } }
  );
}
