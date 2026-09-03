import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram/bot";
import { LAUNCH_PAIRS } from "@/lib/exchanges/pairs";
import type { Listing } from "@/lib/data-sources/types";

/**
 * Price-threshold alert evaluation, run from the poll route right after
 * fresh CoinGecko market data is fetched (see app/api/internal/poll/route.ts).
 *
 * Evaluates against CoinGecko's USD price for the base asset, not the
 * exact live Binance/Bybit tick a visitor's browser sees — those only
 * exist client-side (see lib/exchanges/*-ws.ts), the server never has
 * them. Close enough for a threshold alert (BTC's USD price and its
 * USDT pair price track within cents), and it means alerts don't need a
 * second server-side price feed just for this.
 *
 * One-shot by design for v1 (deactivates the rule once it fires) — the
 * plan's simplest option; re-arming means creating a new alert.
 */
export async function evaluatePriceAlerts(markets: Listing[]) {
  const supabase = getSupabaseServerClient();
  const { data: rules, error } = await supabase
    .from("alert_rules")
    .select("id, chat_id, symbol, direction, threshold")
    .eq("active", true)
    .eq("kind", "price_threshold");

  if (error) {
    console.error("[alerts] failed to load rules", error);
    return { evaluated: 0, fired: 0 };
  }
  if (!rules?.length) return { evaluated: 0, fired: 0 };

  let fired = 0;
  for (const rule of rules) {
    const pair = LAUNCH_PAIRS.find((p) => p.base === rule.symbol);
    if (!pair) continue; // symbol isn't one of the launch pairs — nothing to evaluate against

    const market = markets.find((m) => m.id === pair.coingeckoId);
    if (!market || market.priceUsd === null) continue;

    const crossed =
      rule.direction === "above" ? market.priceUsd >= rule.threshold : market.priceUsd <= rule.threshold;
    if (!crossed) continue;

    const sent = await sendTelegramMessage(
      rule.chat_id,
      `🔔 ${rule.symbol} is now $${market.priceUsd.toLocaleString()} (crossed your $${rule.threshold.toLocaleString()} ${rule.direction} alert).`
    );
    if (!sent) continue; // leave the rule active — retry next poll cycle rather than silently drop it

    await supabase.from("alert_deliveries").insert({ rule_id: rule.id });
    await supabase.from("alert_rules").update({ active: false }).eq("id", rule.id);
    fired += 1;
  }

  return { evaluated: rules.length, fired };
}
