-- Poller health log: one row per source group per poll run. The poll route
-- inserts these and trims rows older than 14 days; the admin panel reads
-- them to show last-success time, failure streaks, and per-source latency.
-- Written by the service-role key only (same trust model as 0001).

create table if not exists poll_runs (
  id bigint generated always as identity primary key,
  grp text not null,                -- 'markets' | 'listings' | 'nft' | 'predictions'
  status text not null,             -- 'ok' | 'empty' | 'error'
  rows integer not null default 0,
  error text,
  duration_ms integer,
  ran_at timestamptz not null default now()
);
create index if not exists poll_runs_ran_at_idx on poll_runs (ran_at desc);
create index if not exists poll_runs_grp_ran_at_idx on poll_runs (grp, ran_at desc);
