/**
 * New-coin listings announced by centralized exchanges. Today: Binance's
 * "New Cryptocurrency Listing" announcement feed (public, no key). It's an
 * unofficial-but-public endpoint, so everything here degrades to an empty
 * list on any failure; the page then says so instead of breaking.
 */

export type ExchangeListing = {
  id: string;
  exchange: "Binance";
  title: string;
  tickers: string[];
  kind: "Spot listing" | "Futures" | "Other";
  publishedAt: string; // ISO
  url: string;
};

const URL_ =
  "https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&catalogId=48&pageNo=1&pageSize=20";

export async function fetchBinanceListings(): Promise<ExchangeListing[]> {
  try {
    const res = await fetch(URL_, {
      headers: { accept: "application/json", "user-agent": "NexusProtocol/1.0" },
      cache: "no-store", // page-level ISR caches the result
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.warn(`[binance-listings] ${res.status}`);
      return [];
    }
    const json = await res.json();
    const articles: { code: string; title: string; releaseDate: number }[] = json?.data?.catalogs?.[0]?.articles ?? [];
    return articles
      .filter((a) => a.title && a.code && a.releaseDate)
      .map((a) => {
        const tickers = [...a.title.matchAll(/\(([A-Z0-9]{2,12})\)/g)].map((m) => m[1]);
        const lower = a.title.toLowerCase();
        const kind: ExchangeListing["kind"] =
          /will (list|add)/.test(lower) && !/futures|perpetual/.test(lower)
            ? "Spot listing"
            : /futures|perpetual/.test(lower)
              ? "Futures"
              : "Other";
        return {
          id: a.code,
          exchange: "Binance" as const,
          title: a.title,
          tickers: [...new Set(tickers)],
          kind,
          publishedAt: new Date(a.releaseDate).toISOString(),
          url: `https://www.binance.com/en/support/announcement/${a.code}`,
        };
      });
  } catch (err) {
    console.warn("[binance-listings] failed", err);
    return [];
  }
}
