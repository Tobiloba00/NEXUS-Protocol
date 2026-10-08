import type { Listing } from "@/lib/data-sources/types";

/** The few fields the coin lists actually draw. Sending whole Listing objects
 * for 100 coins into client components bloats every page's HTML. */
export type SlimCoin = Pick<Listing, "id" | "symbol" | "name" | "image" | "priceUsd" | "change24hPct" | "marketCapUsd" | "spark"> & {
  change7dPct: number | null;
};

export const slimCoin = (l: Listing): SlimCoin => ({
  id: l.id,
  symbol: l.symbol,
  name: l.name,
  image: l.image,
  priceUsd: l.priceUsd,
  change24hPct: l.change24hPct,
  change7dPct: l.change7dPct ?? null,
  marketCapUsd: l.marketCapUsd,
  spark: l.spark,
});
