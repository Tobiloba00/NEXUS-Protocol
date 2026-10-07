-- Lock every table to the service-role key. RLS enabled with no policies =
-- the anon/authenticated roles get no access at all; the server-side
-- service-role key (poller, Telegram webhook, page reads) bypasses RLS, so
-- nothing in the app changes. When user accounts land, add explicit
-- per-table policies here rather than disabling RLS.

alter table listings_cache            enable row level security;
alter table nft_cache                 enable row level security;
alter table prediction_markets_cache  enable row level security;
alter table telegram_subscribers      enable row level security;
alter table alert_rules               enable row level security;
alter table alert_deliveries          enable row level security;
alter table poll_runs                 enable row level security;
