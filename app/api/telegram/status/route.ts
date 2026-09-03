import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Polled by the /alerts page after a visitor clicks the "Connect Telegram"
 * deep link — there's no account/session system in this app, so a random
 * link_code (generated client-side, carried in the t.me deep link's /start
 * payload) is the only thing tying a browser to a chat_id. Once the
 * webhook records that code against a chat_id (see app/api/telegram/webhook),
 * this resolves it so the client can remember the chat_id itself.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ ok: false, error: "missing code" }, { status: 400 });

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("telegram_subscribers")
    .select("chat_id, username")
    .eq("link_code", code)
    .not("linked_at", "is", null)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, chatId: data?.chat_id ?? null, username: data?.username ?? null });
}
