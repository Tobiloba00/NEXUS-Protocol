import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/alerts/[id]">) {
  const { id } = await ctx.params;
  const chatId = request.nextUrl.searchParams.get("chatId");
  if (!chatId) return NextResponse.json({ ok: false, error: "missing chatId" }, { status: 400 });

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("alert_rules")
    .update({ active: false })
    .eq("id", id)
    .eq("chat_id", chatId); // scoped to chatId so one visitor can't deactivate another's rule by guessing an id

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
