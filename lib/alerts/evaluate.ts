import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram/bot";
import { LAUNCH_PAIRS } from "@/lib/exchanges/pairs";
import { fetchBinancePrices, fetchCoinbaseSpot } from "@/lib/data-sources/binance-prices";
import { getMarkets } from "@/lib/data/cache";

/**
 * Price-alert checker, run every couple of minutes by the scheduler (group
 * "alerts" in app/api/internal/poll/route.ts).
 *
 * Price source, in order, per coin:
 *   1. Binance spot (one batched request) — the same price the live ticker shows;
 *   2. Coinbase spot — if Binance can't be reached from the server (exchanges
 *      sometimes block datacenter IPs);
 *   3. the cached CoinGecko snapshot — last resort, up to 15 minutes old.
 *
 * Each alert is delivered exactly once. A rule is *claimed* (switched off)
 * atomically BEFORE the message is sent, so two overlapping runs can't both
 * send it; if sending fails the claim is released and it retries next run.
 */
export type AlertRunResult = { evaluated: number; fired: number; source: string };

export async function checkPriceAlerts(): Promise<AlertRunResult> {
  const supabase = getSupabaseServerClient();
  const { data: rules, error } = await supabase
    .from("alert_rules")
    .select("id, chat_id, symbol, direction, threshold")
    .eq("active", true)
    .eq("kind", "price_threshold");

  if (error) {
    console.error("[alerts] failed to load rules", error);
    return { evaluated: 0, fired: 0, source: "none" };
  }
  if (!rules?.length) return { evaluated: 0, fired: 0, source: "none" };

  const pairs = [...new Set(rules.map((r) => r.symbol))]
    .map((base) => LAUNCH_PAIRS.find((p) => p.base === base && p.quote === "USDT"))
    .filter((p): p is NonNullable<typeof p> => !!p);

  const binance = await fetchBinancePrices(pairs.map((p) => p.binanceSymbol));
  const needCoinbase = pairs.filter((p) => !binance.has(p.binanceSymbol)).map((p) => p.base);
  const coinbase = needCoinbase.length ? await fetchCoinbaseSpot(needCoinbase) : new Map<string, number>();
  let cached: Awaited<ReturnType<typeof getMarkets>>["data"] | null = null;
  const used = new Set<string>();

  const priceFor = async (base: string): Promise<number | null> => {
    const pair = pairs.find((p) => p.base === base);
    if (!pair) return null;
    const b = binance.get(pair.binanceSymbol);
    if (b !== undefined) return used.add("binance"), b;
    const c = coinbase.get(base);
    if (c !== undefined) return used.add("coinbase"), c;
    if (!cached) cached = (await getMarkets(100)).data;
    const price = cached.find((m) => m.id === pair.coingeckoId)?.priceUsd ?? null;
    if (price !== null) used.add("cache");
    return price;
  };

  let fired = 0;
  for (const rule of rules) {
    const price = await priceFor(rule.symbol);
    if (price === null) continue;

    const threshold = Number(rule.threshold);
    const crossed = rule.direction === "above" ? price >= threshold : price <= threshold;
    if (!crossed) continue;

    // Claim first: only the run that flips active true -> false may send.
    const { data: claimed } = await supabase
      .from("alert_rules")
      .update({ active: false })
      .eq("id", rule.id)
      .eq("active", true)
      .select("id");
    if (!claimed?.length) continue;

    const sent = await sendTelegramMessage(
      rule.chat_id,
      `🔔 ${rule.symbol} crossed your alert\n\nNow $${price.toLocaleString("en-US", { maximumFractionDigits: price < 1 ? 6 : 2 })} — ${rule.direction} your $${threshold.toLocaleString("en-US")} level.\n\nInformation only — not financial advice.`
    );
    if (!sent) {
      await supabase.from("alert_rules").update({ active: true }).eq("id", rule.id); // retry next run
      continue;
    }
    await supabase.from("alert_deliveries").insert({ rule_id: rule.id });
    fired += 1;
  }

  return { evaluated: rules.length, fired, source: used.size ? [...used].join("+") : "none" };
}
