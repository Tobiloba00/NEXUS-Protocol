/**
 * Market-wide stats for the Overview dashboard's stat tiles — two free,
 * keyless sources, both confirmed working during this build:
 *  - CoinGecko /global: total market cap, 24h volume, BTC dominance.
 *  - alternative.me's Fear & Greed Index: the crypto market's standard
 *    sentiment gauge, free/keyless, updated once daily.
 */

export type GlobalStats = {
  totalMarketCapUsd: number | null;
  totalVolumeUsd: number | null;
  btcDominancePct: number | null;
  marketCapChangePct24h: number | null;
};

export async function fetchGlobalStats(): Promise<GlobalStats> {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/global", {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return { totalMarketCapUsd: null, totalVolumeUsd: null, btcDominancePct: null, marketCapChangePct24h: null };
    const json = await res.json();
    const d = json.data;
    return {
      totalMarketCapUsd: d.total_market_cap?.usd ?? null,
      totalVolumeUsd: d.total_volume?.usd ?? null,
      btcDominancePct: d.market_cap_percentage?.btc ?? null,
      marketCapChangePct24h: d.market_cap_change_percentage_24h_usd ?? null,
    };
  } catch (err) {
    console.warn("[global-stats] coingecko /global failed", err);
    return { totalMarketCapUsd: null, totalVolumeUsd: null, btcDominancePct: null, marketCapChangePct24h: null };
  }
}

export type FearGreed = { value: number; classification: string } | null;

export async function fetchFearGreed(): Promise<FearGreed> {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1", {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const point = json.data?.[0];
    if (!point) return null;
    return { value: Number(point.value), classification: point.value_classification };
  } catch (err) {
    console.warn("[global-stats] fear & greed failed", err);
    return null;
  }
}
