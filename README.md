# NEXUS Protocol

One free, real-time dashboard for crypto prices & charts, new coin listings,
NFT floor prices, and prediction-market odds — with Telegram alerts and
SEO-first pages, built entirely on free-tier services.

This is a from-scratch Next.js rebuild of the previous single-file app
(preserved at [`legacy/`](legacy/) for reference — it's a no-build,
Babel-in-browser React app with zero server rendering, which is why it was
replaced: real SEO needs server-rendered HTML).

## Stack

- **Next.js** (App Router, TypeScript, Tailwind v4) — deployed on Vercel (free Hobby tier)
- **Supabase** (free Postgres) — cached upstream data + Telegram alert state
- **GitHub Actions** — the scheduled "clock" that refreshes caches and evaluates alerts (Vercel Hobby cron is capped at once/day, too slow for this)
- **Binance / Bybit public WebSockets** — live prices, connected to directly from the browser
- **CoinGecko, DexScreener, Magic Eden, Reservoir, Tensor, Polymarket Gamma** — free/keyless REST APIs, polled server-side and cached (never hit per-visitor)
- **Telegram Bot API** — free alert delivery

## Local dev

```bash
npm install
cp .env.example .env.local   # fill in Supabase + poll-secret + Telegram values as they come online
npm run dev
```

## Architecture at a glance

- Pages that need to rank in search (`/price/[pair]`, `/nft/[collection]`, `/predictions/[slug]`, listing indexes) are SSG+ISR, reading from a Supabase cache table — never calling upstream APIs per request.
- `app/api/internal/poll/route.ts` is the one route that does real upstream work: fetches all sources, writes normalized rows to Supabase, evaluates Telegram alert rules. `.github/workflows/poller.yml` hits it on a schedule with a shared secret.
- Live price ticks are a client-side WebSocket straight to the exchange — no backend in that path at all.
- The branding/admin panel (`Ctrl/Cmd+Shift+K`, once ported) and the light/dark/auto theme system are carried over conceptually from the legacy app's `PROJECT_CONFIG`/CSS-variable approach — see `lib/config/project-config.ts`.

## Status

Infra skeleton stage: Next.js scaffold, theme + branding system ported, Supabase schema drafted, poll-route + GitHub Actions clock wired (stub — no data sources yet). Data-source modules, live charts, NFT/prediction UI, Telegram bot, and the SEO layer land next per the build plan.
