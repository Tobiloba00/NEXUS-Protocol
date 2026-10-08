-- A reliable clock that lives in the database itself.
--
-- GitHub Actions' scheduler is best-effort: in practice the poller ran every
-- few HOURS instead of every 15 minutes, so price alerts were starved.
-- pg_cron runs inside Postgres and fires on time; pg_net makes the HTTP call.
--
-- The bearer secret is NOT in this file: it is stored in Supabase Vault under
-- the name 'nexus_cron_secret' (created out-of-band) and read at call time.
-- The same value is the CRON_SECRET env var on the web app.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Daily Telegram brief: opt-out flag.
alter table telegram_subscribers add column if not exists digest_enabled boolean not null default true;

-- Calls the poller for a comma-separated list of groups. To change the site
-- address (e.g. a custom domain), edit the URL below and re-run this statement.
create or replace function nexus_poll(groups text) returns void
language plpgsql
security definer
set search_path = public, extensions, vault, net
as $$
declare
  secret text;
begin
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'nexus_cron_secret' limit 1;
  if secret is null then
    raise warning 'nexus_poll: vault secret nexus_cron_secret is missing';
    return;
  end if;
  perform net.http_post(
    url := 'https://nexus-protocol-inky.vercel.app/api/internal/poll?groups=' || groups,
    headers := jsonb_build_object('Authorization', 'Bearer ' || secret, 'Content-Type', 'application/json'),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
end;
$$;

-- Re-runnable: drop any previous copies first.
do $$
begin
  perform cron.unschedule(jobname) from cron.job where jobname in ('nexus-alerts', 'nexus-fast', 'nexus-slow');
end $$;

select cron.schedule('nexus-alerts', '*/2 * * * *',  $$select nexus_poll('alerts')$$);                  -- price alerts: every 2 min
select cron.schedule('nexus-fast',   '*/5 * * * *',  $$select nexus_poll('listings,predictions')$$);    -- new tokens + odds: every 5 min
select cron.schedule('nexus-slow',   '*/15 * * * *', $$select nexus_poll('markets,nft,brief')$$);       -- CoinGecko-budgeted data: every 15 min
