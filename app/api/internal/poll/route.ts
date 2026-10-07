import { NextRequest, NextResponse } from "next/server";
import { fetchTopMarkets } from "@/lib/data-sources/coingecko";
import { fetchNewTokenProfiles } from "@/lib/data-sources/dexscreener";
import { fetchAllNftCollections } from "@/lib/data-sources/nft-aggregate";
import { fetchActiveMarkets } from "@/lib/data-sources/polymarket";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { evaluatePriceAlerts } from "@/lib/alerts/evaluate";
import { ensureTodaysBrief } from "@/lib/ai/brief";
import type { Listing } from "@/lib/data-sources/types";

/**
 * The one route a scheduler calls (.github/workflows/poller.yml). Only this
 * route talks to upstream APIs; pages read the Supabase cache it fills
 * (lib/data/cache.ts), so site traffic never scales upstream API usage.
 *
 * Sources are split into groups so each can run on its own cadence and stay
 * inside its free-tier budget — CoinGecko's Demo plan is only 10k calls a
 * month, so "markets" runs every 15 min (~2.9k calls/mo) while the generous
 * DexScreener/Polymarket groups run every 5. Call with
 * `?groups=markets,nft` (comma list); omitted = all groups.
 *
 * Last-known-good: an empty upstream result never overwrites the cache, so
 * an outage or rate limit leaves the previous data on screen. Every run is
 * logged to poll_runs for the admin health view.
 */

const GROUPS = ["markets", "listings", "nft", "predictions", "brief"] as const;
type Group = (typeof GROUPS)[number];

type GroupResult = {
  status: "ok" | "empty" | "error";
  rows: number;
  ms: number;
  error: string | null;
};

// Stamp each row's position so readers can restore the source's ordering
// (a cache table has no inherent row order).
const ranked = <T extends object>(rows: T[]) => rows.map((r, i) => ({ ...r, rank: i }));

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

  const requested = request.nextUrl.searchParams.get("groups");
  const groups: Group[] = requested
    ? GROUPS.filter((g) => requested.split(",").includes(g))
    : [...GROUPS];
  if (!groups.length) {
    return NextResponse.json({ ok: false, error: `unknown groups; valid: ${GROUPS.join(",")}` }, { status: 400 });
  }

  const hasDb = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const supabase = hasDb ? getSupabaseServerClient() : null;
  const fetchedAt = new Date().toISOString();

  let marketsForAlerts: Listing[] = [];

  async function run<T extends object>(
    fetcher: () => Promise<T[]>,
    write: (rows: ReturnType<typeof ranked<T>>) => PromiseLike<{ error: { message: string } | null }>
  ): Promise<GroupResult & { data: T[] }> {
    const started = Date.now();
    let data: T[] = [];
    let status: GroupResult["status"] = "ok";
    let error: string | null = null;

    try {
      data = await fetcher();
    } catch (err) {
      status = "error";
      error = err instanceof Error ? err.message : String(err);
    }

    if (status === "ok" && data.length === 0) {
      status = "empty";
      error = "upstream returned no rows (down, rate limited, or empty) — cache left untouched";
    } else if (status === "ok" && supabase) {
      try {
        const { error: writeError } = await write(ranked(data));
        if (writeError) {
          status = "error";
          error = `cache write failed: ${writeError.message}`;
        }
      } catch (err) {
        status = "error";
        error = err instanceof Error ? err.message : String(err);
      }
    }

    return { status, rows: data.length, ms: Date.now() - started, error, data };
  }

  const tasks: Record<Group, () => Promise<GroupResult & { data: unknown[] }>> = {
    // Once per UTC day (a no-op on every other run): the AI-written home-page brief.
    brief: async () => {
      const started = Date.now();
      const r = await ensureTodaysBrief();
      const ok = r.status !== "unavailable";
      return {
        status: ok ? "ok" : "empty",
        rows: r.status === "generated" ? 1 : 0,
        ms: Date.now() - started,
        error: ok ? null : (r.detail ?? "brief unavailable"),
        data: [],
      };
    },
    markets: async () => {
      const r = await run(
        () => fetchTopMarkets(100),
        (rows) =>
          supabase!.from("listings_cache").upsert(
            rows.map((m) => ({
              id: m.id,
              source: m.source,
              symbol: m.symbol,
              name: m.name,
              data: m,
              fetched_at: fetchedAt,
            }))
          )
      );
      marketsForAlerts = r.data;
      return r;
    },
    listings: () =>
      run(
        () => fetchNewTokenProfiles(20),
        (rows) =>
          supabase!.from("listings_cache").upsert(
            rows.map((l) => ({
              id: l.id,
              source: l.source,
              symbol: l.symbol,
              name: l.name,
              data: l,
              fetched_at: fetchedAt,
            }))
          )
      ),
    nft: () =>
      run(
        () => fetchAllNftCollections(60),
        (rows) =>
          supabase!.from("nft_cache").upsert(
            rows.map((n) => ({
              id: n.id,
              source: n.source,
              chain: n.chain,
              name: n.name,
              data: n,
              fetched_at: fetchedAt,
            }))
          )
      ),
    predictions: () =>
      run(
        () => fetchActiveMarkets(50),
        (rows) =>
          supabase!.from("prediction_markets_cache").upsert(
            rows.map((p) => ({
              slug: p.slug,
              question: p.question,
              data: p,
              fetched_at: fetchedAt,
            }))
          )
      ),
  };

  // Groups run in parallel; each is isolated, so one dead source never sinks the others.
  const settled = await Promise.all(
    groups.map(async (g) => {
      const { data: _data, ...result } = await tasks[g]();
      void _data;
      return [g, result] as const;
    })
  );
  const results = Object.fromEntries(settled) as Record<Group, GroupResult>;

  let alerts: { evaluated: number; fired: number } | "skipped" = "skipped";
  if (supabase) {
    // Alerts need fresh prices, so they ride along with the markets group.
    if (results.markets?.status === "ok") {
      try {
        alerts = await evaluatePriceAlerts(marketsForAlerts);
      } catch (err) {
        console.error("[poll] alert evaluation failed", err);
      }
    }

    // Health log for the admin panel. Failure to log (e.g. migration 0002
    // not applied yet) must never fail the poll itself.
    try {
      const { error } = await supabase.from("poll_runs").insert(
        settled.map(([g, r]) => ({
          grp: g,
          status: r.status,
          rows: r.rows,
          error: r.error,
          duration_ms: r.ms,
        }))
      );
      if (error) console.warn("[poll] poll_runs insert failed", error.message);

      // Keep the log small — free tier is 500 MB total.
      await supabase
        .from("poll_runs")
        .delete()
        .lt("ran_at", new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString());
    } catch (err) {
      console.warn("[poll] poll_runs logging threw", err);
    }
  }

  // If everything requested failed, return 502 so the scheduler run shows red.
  const allFailed = groups.every((g) => results[g].status !== "ok");
  return NextResponse.json(
    {
      ok: !allFailed,
      ranAt: new Date().toISOString(),
      db: hasDb ? "connected" : "not configured (results not cached)",
      groups: results,
      alerts,
    },
    { status: allFailed ? 502 : 200 }
  );
}
