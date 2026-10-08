import { getPairBySlug, type PairConfig } from "./pairs";
import { getMarkets } from "@/lib/data/cache";

/**
 * Resolves /trade/<slug> for ANY top-100 coin, not just the 8 launch pairs.
 * Launch pairs keep their hand-written config (ETH/BTC etc.); anything else
 * of the form "<symbol>-usdt" is built from the cached market list, mapping the
 * ticker to its Binance symbol and CoinGecko id. Unknown slugs return null.
 */
export async function resolvePair(slug: string): Promise<PairConfig | null> {
  const launch = getPairBySlug(slug);
  if (launch) return launch;

  const m = /^([a-z0-9]{1,15})-usdt$/.exec(slug);
  if (!m) return null;
  const { data } = await getMarkets(100);
  const coin = data.find((c) => c.symbol.toLowerCase() === m[1]); // list is sorted by market cap, so ties go to the biggest
  if (!coin) return null;
  return {
    slug,
    binanceSymbol: `${coin.symbol}USDT`,
    coingeckoId: coin.id,
    base: coin.symbol,
    quote: "USDT",
  };
}
