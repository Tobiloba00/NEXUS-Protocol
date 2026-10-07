-- AI features.
--  ai_usage:  global daily request counter so the free Gemini quota can't be
--             drained (see lib/ai/limits.ts).
--  ai_briefs: one generated market brief per day, shown on the home page and
--             archived for SEO (see lib/ai/brief.ts).
-- Service-role access only; RLS on with no policies, same as 0003.

create table if not exists ai_usage (
  day date primary key,
  count integer not null default 0
);

create table if not exists ai_briefs (
  day date primary key,
  body text not null,
  model text,
  created_at timestamptz not null default now()
);

alter table ai_usage enable row level security;
alter table ai_briefs enable row level security;
