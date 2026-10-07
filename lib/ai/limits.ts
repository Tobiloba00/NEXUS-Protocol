import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Two cheap guards, because the Ask endpoint is public and Gemini's free tier
 * is finite:
 *  1. per-IP burst limit (in-memory — best effort across serverless
 *     instances, but it stops a single script hammering one instance);
 *  2. a global daily request budget kept in Supabase (ai_usage), so the free
 *     quota can't be drained by anyone, however many IPs they use.
 */

const WINDOW_MS = 60_000;
const PER_IP_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

export function ipAllowed(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= PER_IP_PER_WINDOW) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  // Keep the map from growing without bound on a long-lived instance.
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  return true;
}

export const DAILY_BUDGET = Number(process.env.AI_DAILY_BUDGET ?? 400);

/** Spends one unit of today's global budget. Fails open if the database is
 * unavailable (an outage shouldn't take the assistant down); the per-IP
 * limit and Gemini's own quota still apply. */
export async function spendDailyBudget(): Promise<boolean> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return true;
  try {
    const supabase = getSupabaseServerClient();
    const day = new Date().toISOString().slice(0, 10);
    const { data } = await supabase.from("ai_usage").select("count").eq("day", day).maybeSingle();
    const used = data?.count ?? 0;
    if (used >= DAILY_BUDGET) return false;
    await supabase.from("ai_usage").upsert({ day, count: used + 1 });
    return true;
  } catch (err) {
    console.warn("[ai] budget check failed, allowing request", err);
    return true;
  }
}
