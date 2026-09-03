import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendTelegramMessage, parseSetAlertCommand } from "@/lib/telegram/bot";
import { LAUNCH_PAIRS } from "@/lib/exchanges/pairs";

const SUPPORTED_SYMBOLS = LAUNCH_PAIRS.map((p) => p.base).join(", ");
const HELP_TEXT = `Commands:
/setalert SYMBOL above|below PRICE — e.g. /setalert BTC above 70000
/myalerts — list your active alerts
/delete ID — remove one (ID from /myalerts)

Supported symbols: ${SUPPORTED_SYMBOLS}`;

type TelegramUpdate = {
  message?: {
    chat: { id: number; username?: string };
    text?: string;
  };
};

/**
 * Telegram calls this on every message sent to the bot (event-driven, no
 * polling needed for the inbound direction — see plan's data-flow (c)).
 * Verified against TELEGRAM_WEBHOOK_SECRET (set once via setWebhook, see
 * lib/telegram/bot.ts#webhookSetupInstructions) so this endpoint can't be
 * driven by anyone who merely finds the URL.
 */
export async function POST(request: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const got = request.headers.get("x-telegram-bot-api-secret-token");
    if (got !== expectedSecret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ ok: true }); // ignore unparseable bodies rather than error to Telegram
  }

  const message = update.message;
  if (!message?.text || !message.chat?.id) {
    return NextResponse.json({ ok: true }); // non-text update (photo, edit, etc.) — nothing to do
  }

  const chatId = message.chat.id;
  const text = message.text.trim();
  const supabase = getSupabaseServerClient();

  if (text.startsWith("/start")) {
    const code = text.split(/\s+/)[1] ?? null;
    await supabase.from("telegram_subscribers").upsert({
      chat_id: chatId,
      username: message.chat.username ?? null,
      link_code: code,
      linked_at: new Date().toISOString(),
    });
    await sendTelegramMessage(
      chatId,
      code
        ? "Connected! Head back to the website's Alerts page — it should now show you're linked."
        : `Welcome to NEXUS Protocol alerts.\n\n${HELP_TEXT}`
    );
    return NextResponse.json({ ok: true });
  }

  if (text.startsWith("/setalert")) {
    const parsed = parseSetAlertCommand(text);
    const pair = parsed ? LAUNCH_PAIRS.find((p) => p.base === parsed.symbol) : null;

    if (!parsed || !pair) {
      await sendTelegramMessage(chatId, `Couldn't parse that.\n\n${HELP_TEXT}`);
      return NextResponse.json({ ok: true });
    }

    // Ensure a subscriber row exists even if they never went through the
    // website's "Connect Telegram" flow (messaging the bot directly works too).
    await supabase.from("telegram_subscribers").upsert({ chat_id: chatId });
    await supabase.from("alert_rules").insert({
      chat_id: chatId,
      kind: "price_threshold",
      symbol: parsed.symbol,
      direction: parsed.direction,
      threshold: parsed.threshold,
      active: true,
    });
    await sendTelegramMessage(
      chatId,
      `Alert set: ${parsed.symbol} ${parsed.direction} $${parsed.threshold.toLocaleString()}. I'll message you once, when it crosses.`
    );
    return NextResponse.json({ ok: true });
  }

  if (text.startsWith("/myalerts")) {
    const { data } = await supabase
      .from("alert_rules")
      .select("id, symbol, direction, threshold")
      .eq("chat_id", chatId)
      .eq("active", true);

    if (!data?.length) {
      await sendTelegramMessage(chatId, "No active alerts. Use /setalert SYMBOL above|below PRICE to create one.");
    } else {
      const lines = data
        .map((r) => `${r.symbol} ${r.direction} $${Number(r.threshold).toLocaleString()}\nid: ${r.id}`)
        .join("\n\n");
      await sendTelegramMessage(chatId, `Active alerts:\n\n${lines}\n\nUse /delete <id> to remove one.`);
    }
    return NextResponse.json({ ok: true });
  }

  if (text.startsWith("/delete")) {
    const id = text.split(/\s+/)[1];
    if (id) {
      await supabase.from("alert_rules").update({ active: false }).eq("chat_id", chatId).eq("id", id);
    }
    await sendTelegramMessage(chatId, "Removed, if that ID belonged to you.");
    return NextResponse.json({ ok: true });
  }

  await sendTelegramMessage(chatId, HELP_TEXT);
  return NextResponse.json({ ok: true });
}
