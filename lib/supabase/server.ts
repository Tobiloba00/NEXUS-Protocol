import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — SERVER-ONLY. Used by the poller route and
 * the Telegram webhook, which need to write cache tables and alert state
 * that anonymous browser clients must not be able to touch directly. Never
 * import this file from a Client Component ("use client") — the service
 * role key must never reach the browser bundle.
 */
export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars (see .env.example)."
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
