import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "./bot";

/**
 * Sends the day's AI brief to everyone who linked Telegram and hasn't opted
 * out (/digest off). Called once, right after the brief is generated.
 * Sequential on purpose: Telegram limits bots to ~30 messages a second and a
 * small audience doesn't need parallelism.
 */
export async function sendBriefDigest(day: string, body: string): Promise<number> {
  const supabase = getSupabaseServerClient();
  const { data: subs, error } = await supabase
    .from("telegram_subscribers")
    .select("chat_id")
    .not("linked_at", "is", null)
    .eq("digest_enabled", true);
  if (error || !subs?.length) return 0;

  const date = new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
  const text =
    `📰 NEXUS brief — ${date}\n\n${body}\n\n` +
    `AI-written from live data. Information only — not financial advice. NEXUS accepts no liability for any loss.\n` +
    `Reply /digest off to stop these.`;

  let sent = 0;
  for (const s of subs) {
    if (await sendTelegramMessage(s.chat_id, text.slice(0, 4000))) sent += 1;
  }
  return sent;
}
