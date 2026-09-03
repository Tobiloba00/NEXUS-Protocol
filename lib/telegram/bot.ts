/**
 * Telegram Bot API — free, no volume cap. Server-only: TELEGRAM_BOT_TOKEN
 * must never reach the browser. sendMessage never throws (mirrors every
 * other data-source module's try/catch->false-on-failure contract) since a
 * failed alert delivery shouldn't crash the poll route's whole run.
 */

function apiBase(token: string) {
  return `https://api.telegram.org/bot${token}`;
}

export async function sendTelegramMessage(chatId: number | string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN not set, skipping send");
    return false;
  }
  try {
    const res = await fetch(`${apiBase(token)}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) {
      console.warn(`[telegram] sendMessage ${res.status}`, await res.text());
    }
    return res.ok;
  } catch (err) {
    console.warn("[telegram] sendMessage failed", err);
    return false;
  }
}

export type ParsedSetAlert = { symbol: string; direction: "above" | "below"; threshold: number };

/** "/setalert BTC above 70000" -> {symbol:"BTC", direction:"above", threshold:70000} */
export function parseSetAlertCommand(text: string): ParsedSetAlert | null {
  const match = text.trim().match(/^\/setalert(?:@\w+)?\s+(\w+)\s+(above|below)\s+([\d.]+)\s*$/i);
  if (!match) return null;
  const threshold = Number(match[3]);
  if (!Number.isFinite(threshold) || threshold <= 0) return null;
  return {
    symbol: match[1].toUpperCase(),
    direction: match[2].toLowerCase() as "above" | "below",
    threshold,
  };
}

/** One-time setup call (run manually once, not from app code) to point
 * Telegram at our webhook. Documented here rather than automated since it
 * only needs to run once per bot/domain change. */
export function webhookSetupInstructions(siteUrl: string) {
  return `curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" -H "content-type: application/json" -d '{"url":"${siteUrl}/api/telegram/webhook","secret_token":"<TELEGRAM_WEBHOOK_SECRET>"}'`;
}
