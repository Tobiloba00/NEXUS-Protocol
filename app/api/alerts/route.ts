import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { LAUNCH_PAIRS } from "@/lib/exchanges/pairs";

/**
 * No account/auth system exists yet (out of scope per the plan — payments
 * and accounts are both deferred). chatId is passed explicitly by the
 * client, which learned it from /api/telegram/status after linking. This
 * means anyone who somehow learned another visitor's chatId could list or
 * create alerts against it — an acceptable v1 gap given nothing here is
 * sensitive or paid, but a real limitation worth fixing before this ever
 * handles anything that matters. Flagging rather than hiding it.
 */

export async function GET(request: NextRequest) {
  const chatId = request.nextUrl.searchParams.get("chatId");
  if (!chatId) return NextResponse.json({ ok: false, error: "missing chatId" }, { status: 400 });

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("alert_rules")
    .select("id, symbol, direction, threshold, created_at")
    .eq("chat_id", chatId)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, rules: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { chatId, symbol, direction, threshold } = body ?? {};

  if (!chatId || !symbol || (direction !== "above" && direction !== "below") || !Number.isFinite(threshold)) {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }
  const pair = LAUNCH_PAIRS.find((p) => p.base === symbol);
  if (!pair) {
    return NextResponse.json({ ok: false, error: `unsupported symbol: ${symbol}` }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("alert_rules").insert({
    chat_id: chatId,
    kind: "price_threshold",
    symbol,
    direction,
    threshold,
    active: true,
  });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
