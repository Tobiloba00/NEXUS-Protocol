/**
 * Icon sources serve huge originals by default (CoinGecko "large" is 250px+,
 * DexScreener asks for 800px). A 36px list icon doesn't need that — and with
 * 100 rows on screen it was the biggest cause of slow loads on phones. This
 * rewrites known CDN URLs to a small variant (still crisp at 2-3x density).
 */
export function thumb(src: string, cssPx = 40): string {
  try {
    if (src.includes("coingecko.com") && /\/(large|small|thumb)\//.test(src)) {
      return src.replace(/\/(large|small|thumb)\//, cssPx > 28 ? "/small/" : "/thumb/");
    }
    if (src.includes("dexscreener.com")) {
      const u = new URL(src);
      // DexScreener's image CDN rejects (HTTP 422) any size it doesn't whitelist:
      // 64 and 128 are confirmed to work, 96 and 200 are not. Pick from those.
      const px = cssPx <= 26 ? "64" : "128";
      u.searchParams.set("width", px);
      u.searchParams.set("height", px);
      return u.toString();
    }
  } catch {
    // fall through to the original URL
  }
  return src;
}
