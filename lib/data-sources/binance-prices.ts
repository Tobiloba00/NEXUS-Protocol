/**
 * Latest Binance spot prices for a handful of symbols in ONE keyless request
 * (the market-data-only host, which is the one meant for server use). Used by
 * the alert checker so alerts compare against the same price the live ticker
 * shows, every couple of minutes, without spending any CoinGecko quota.
 * Returns an empty map on any failure; callers fall back to cached prices.
 */
export async function fetchBinancePrices(symbols: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!symbols.length) return out;
  try {
    const url = `https://data-api.binance.vision/api/v3/ticker/price?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      console.warn(`[binance-prices] ${res.status}`);
      return out;
    }
    const rows: { symbol: string; price: string }[] = await res.json();
    for (const r of rows) {
      const p = Number(r.price);
      if (Number.isFinite(p) && p > 0) out.set(r.symbol, p);
    }
  } catch (err) {
    console.warn("[binance-prices] failed", err);
  }
  return out;
}

/**
 * Coinbase spot prices (USD), one small request per coin, in parallel. A
 * second live source for when Binance can't be reached from the server
 * (exchanges sometimes block datacenter IPs). USD vs USDT differ by cents,
 * which doesn't matter for a price-threshold alert. Keyed by base ticker.
 */
export async function fetchCoinbaseSpot(bases: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  await Promise.all(
    bases.map(async (base) => {
      try {
        const res = await fetch(`https://api.coinbase.com/v2/prices/${encodeURIComponent(base)}-USD/spot`, {
          headers: { accept: "application/json" },
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return;
        const price = Number((await res.json())?.data?.amount);
        if (Number.isFinite(price) && price > 0) out.set(base, price);
      } catch {
        // this coin falls through to the next source
      }
    })
  );
  return out;
}
