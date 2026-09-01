-- NEXUS Protocol: initial schema.
-- Applied via the Supabase SQL editor or `supabase db push`. All tables are
-- written to exclusively by server-side code holding the service-role key
-- (the poller route, the Telegram webhook) — see lib/supabase/server.ts.
-- No RLS policies are defined yet because nothing here is read directly by
-- the anon/browser client in the current architecture (pages read via ISR
-- from the Next.js server, not from Supabase in the browser); add RLS
-- before ever exposing these tables to an anon key.

-- ---------------------------------------------------------------------
-- Cache tables: one row per (source, key), refreshed every poll cycle.
-- ---------------------------------------------------------------------

create table if not exists listings_cache (
  id text primary key,              -- e.g. coingecko coin id, or dexscreener pair address
  source text not null,             -- 'coingecko' | 'dexscreener'
  symbol text,
  name text,
  data jsonb not null,              -- normalized payload for this row
  fetched_at timestamptz not null default now()
);
create index if not exists listings_cache_source_idx on listings_cache (source);
create index if not exists listings_cache_fetched_at_idx on listings_cache (fetched_at desc);

create table if not exists nft_cache (
  id text primary key,              -- normalized, lowercased collection name (dedup key)
  source text not null,             -- 'magiceden' | 'reservoir' | 'tensor'
  chain text,
  name text,
  data jsonb not null,
  fetched_at timestamptz not null default now()
);
create index if not exists nft_cache_source_idx on nft_cache (source);

create table if not exists prediction_markets_cache (
  slug text primary key,            -- polymarket market slug
  question text,
  data jsonb not null,
  fetched_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Telegram alert state
-- ---------------------------------------------------------------------

create table if not exists telegram_subscribers (
  chat_id bigint primary key,
  username text,
  link_code text unique,            -- one-time code used by the /alerts "Connect Telegram" deep link
  linked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists alert_rules (
  id uuid primary key default gen_random_uuid(),
  chat_id bigint not null references telegram_subscribers (chat_id) on delete cascade,
  kind text not null,               -- 'price_threshold' | 'new_listing' | 'nft_floor_move'
  symbol text,                      -- e.g. 'BTCUSDT', or a collection id for nft_floor_move
  direction text,                   -- 'above' | 'below', for price_threshold
  threshold numeric,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists alert_rules_active_idx on alert_rules (active) where active;

create table if not exists alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references alert_rules (id) on delete cascade,
  sent_at timestamptz not null default now()
);
create index if not exists alert_deliveries_rule_id_idx on alert_deliveries (rule_id, sent_at desc);
-- No DB-level uniqueness enforces idempotency (sent_at has no natural
-- dedup key across poll runs) — the poll route itself must check for a
-- recent delivery before sending, then either deactivate a one-shot rule
-- or record a cooldown window. See lib/telegram/bot.ts (Days 9-10).
