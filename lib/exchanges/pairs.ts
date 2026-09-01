/**
 * Launch pair list (plan's open question #1, defaulted rather than
 * blocked on): top pairs by interest, mapped to both a Binance symbol
 * (for the live WS ticker/kline) and a CoinGecko coin id (for seeding the
 * chart's initial OHLC before live ticks take over — see
 * lib/data-sources/coingecko.ts#fetchOhlc). Slug is the URL segment used
 * by /trade/[pair] and /price/[pair].
 */

export type PairConfig = {
  slug: string; // e.g. "btc-usdt"
  binanceSymbol: string; // e.g. "BTCUSDT"
  coingeckoId: string; // e.g. "bitcoin"
  base: string;
  quote: string;
};

export const LAUNCH_PAIRS: PairConfig[] = [
  { slug: "btc-usdt", binanceSymbol: "BTCUSDT", coingeckoId: "bitcoin", base: "BTC", quote: "USDT" },
  { slug: "eth-usdt", binanceSymbol: "ETHUSDT", coingeckoId: "ethereum", base: "ETH", quote: "USDT" },
  { slug: "eth-btc", binanceSymbol: "ETHBTC", coingeckoId: "ethereum", base: "ETH", quote: "BTC" },
  { slug: "bnb-usdt", binanceSymbol: "BNBUSDT", coingeckoId: "binancecoin", base: "BNB", quote: "USDT" },
  { slug: "sol-usdt", binanceSymbol: "SOLUSDT", coingeckoId: "solana", base: "SOL", quote: "USDT" },
  { slug: "xrp-usdt", binanceSymbol: "XRPUSDT", coingeckoId: "ripple", base: "XRP", quote: "USDT" },
  { slug: "doge-usdt", binanceSymbol: "DOGEUSDT", coingeckoId: "dogecoin", base: "DOGE", quote: "USDT" },
  { slug: "ada-usdt", binanceSymbol: "ADAUSDT", coingeckoId: "cardano", base: "ADA", quote: "USDT" },
];

export function getPairBySlug(slug: string): PairConfig | undefined {
  return LAUNCH_PAIRS.find((p) => p.slug === slug);
}
