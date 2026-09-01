import { NextRequest, NextResponse } from "next/server";

/**
 * The one route GitHub Actions calls on a schedule (.github/workflows/poller.yml).
 * Stub for now (Days 1-2 goal: prove the clock works before it does real
 * work) — real upstream fetches land in lib/data-sources/* on Days 3-4 and
 * get wired in here.
 *
 * Secret-gated so this can't be hit/abused by the public: GitHub Actions
 * sends the shared secret as a bearer token, matched against
 * POLL_SECRET (set in both Vercel env and the repo's GitHub Actions secrets).
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const expected = process.env.POLL_SECRET;

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "POLL_SECRET is not configured on the server" },
      { status: 500 }
    );
  }
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // TODO (Days 3-4): Promise.allSettled fan-out to lib/data-sources/*,
  // upsert into Supabase cache tables, revalidatePath the affected pages.
  // TODO (Days 9-10): evaluate alert_rules against freshly written data,
  // send Telegram messages via lib/telegram/bot.ts.
  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    sources: [],
    note: "poll route stub — no data sources wired yet",
  });
}
