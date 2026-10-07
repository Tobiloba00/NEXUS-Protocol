# NEXUS: Research and Roadmap (October 2026)

Goal: one free-tier-built platform for prices, new listings, DeFi, NFTs, and prediction markets, driven by SEO, with user login, Gemini-powered features, and an admin analytics area.

**How to read this.** Facts marked **(official)** were read from the provider's own page. Facts marked **(third-party)** came from blog or aggregator pages that sometimes disagree with each other. Check those before building on them. Anything marked **(unverified)** I did not confirm. Free-tier terms change often, so re-check each one the week you integrate it.

---

## 1. Findings that change the current plan

These come from checking the research against the code as it stands today.

### 1.1 CoinGecko's free quota is too small for the current design
- Free Demo plan: **10,000 credits a month, 100 calls a minute, attribution required, non-commercial** (official, coingecko.com/en/api/pricing). Third-party pages say 30 calls a minute, so treat the per-minute figure as uncertain. The monthly cap is the real constraint.
- `poller.yml` runs every 5 minutes, which is about 8,640 runs a month. Each run calls `fetchTopMarkets` once, so the poller alone uses roughly 86% of the monthly budget.
- The pages also call CoinGecko directly. `app/page.tsx` calls `fetchTopMarkets` and `fetchOhlc`, and `app/trade/[pair]/page.tsx` and `app/markets/page.tsx` do the same. With a revalidate time of 120 to 300 seconds, each page hits upstream every time it regenerates. This contradicts the README ("never calling upstream APIs per request"). The poller writes to Supabase, but the pages don't read from it.
- `fetchTopMarkets` returns `[]` on any error (it does for a 429 too), so the site can quietly show empty panels once the quota runs out.
- Without a key, requests go through the keyless public tier, whose limits I did not verify.

**Fix.**
1. Pages read only from Supabase. Only the poller talks to upstream. This is the architecture the README already describes.
2. Use tiered poll frequencies:
   - Top-100 coin prices: every 15 minutes at most, since live prices come from WebSockets anyway.
   - NFT and prediction data: every 15 to 30 minutes.
   - New listings: every 5 to 10 minutes (DexScreener, not CoinGecko).
3. Get a free Demo key and send it with every call.
4. Add a second price source so CoinGecko isn't a single point of failure. CoinPaprika offers about 20,000 calls a month with no key, and (third-party) allows commercial use.
5. Log every poll to a `poll_runs` table (source, status, latency, rows) so the admin panel can show quota and health.

### 1.2 The Reservoir module is dead code
Reservoir shut down its NFT API on **15 October 2025** (third-party news). `lib/data-sources/reservoir.ts` can never return data. Remove it, or it hides the fact that Magic Eden is your only NFT source. Magic Eden's own EVM API is also reported as deprecated (third-party). So today your NFT coverage is **Solana only**.

### 1.3 Hosting terms limit monetization
- Vercel Hobby **prohibits commercial use** (third-party, consistent across several sources). Ads or paid tiers on Hobby violate the terms.
- CoinGecko Demo is also non-commercial. The Basic plan is $35 a month for 100,000 credits and allows commercial use with attribution (official).
- Cloudflare's free tier allows commercial use (third-party). Next.js runs there through the OpenNext adapter (`@opennextjs/cloudflare`), with some App Router caveats.

**Decision for you:** stay on Vercel Hobby plus CoinGecko Demo while the site has no ads or paid features (a pre-monetization phase), then pay roughly $55 a month for Vercel Pro and CoinGecko Basic, or move to Cloudflare. Plan the switch before turning on ads.

### 1.4 The GitHub Actions scheduler is the weakest link
- Scheduled workflows are best-effort. They can run 5 to 30 minutes late, and under load some are dropped silently (third-party, GitHub community threads).
- On public repos, GitHub **disables scheduled workflows after 60 days without commits** and sends no warning.

**Fix.** Use Cloudflare Workers Cron Triggers as the main clock. The free plan allows 5 triggers with 1-minute granularity (third-party). The Worker only needs to make one authenticated `fetch` to your poll route, which fits inside the 10 ms CPU limit. Keep GitHub Actions as a backup. The poll route should be idempotent, so a duplicate trigger does no harm.

### 1.5 Live prices work for most users but not all
- Binance returns HTTP 451 to many datacenter IPs, such as Vercel's (third-party). Your design connects from the browser, so that is fine.
- Binance.com is blocked for users in the US. Those users get nothing from Binance.
- Binance publishes market-data-only hosts, `data-stream.binance.vision` and `data-api.binance.vision` (official). They are worth testing as server fallbacks. I did not verify whether they work from Vercel.

**Fix.** `lib/exchanges/` already has Bybit. Add automatic failover (Binance, then Bybit, then a Coinbase or Kraken public WebSocket) and show the active source in the status chip. I did not verify Coinbase or Kraken limits.

### 1.6 Supabase free plan
500 MB database, 50,000 monthly active users for auth, 5 GB bandwidth, and projects **pause after 1 week of inactivity** (third-party, consistent). Your poller's writes keep it active, but if the clock stops (see 1.4), the whole site can go dark. Add retention rules to any time-series tables so you don't hit 500 MB.

---

## 2. Is "everything in one place" really unclaimed?

Partly. CoinGecko already covers coins, NFT collections, and DEX pools (GeckoTerminal). DefiLlama owns DeFi. Polymarket is separate. What I did not find in my searches is one site that **also** includes prediction markets, cross-asset alerts, and an AI layer. That is a stronger pitch than "all in one" alone:

> One search box and one alert system across coins, DEX tokens, DeFi protocols, NFTs, and prediction markets. Plain-language AI summaries grounded in the data.

Your edge is the **cross-links**: a token page that shows its DEX liquidity, its protocol TVL, related prediction markets, and an alert button. No single competitor page does all of those.

---

## 3. Data sources: what to add, in priority order

| Priority | Source | Covers | Free limits | Notes |
|---|---|---|---|---|
| Now | CoinGecko Demo | Coin markets, OHLC | 10k credits a month (official) | Attribution required, non-commercial |
| Now | CoinPaprika | Coin markets backup | ~20k a month, no key (third-party) | Commercial use reportedly OK |
| Now | DexScreener | New DEX pairs | Already in use | Check their terms before relying on it commercially |
| Now | Polymarket Gamma | Prediction markets | Very high: 300 to 900 requests per 10 s per endpoint (official) | Not a constraint |
| Next | **GeckoTerminal API** | New pools, trending pools, pool OHLCV, 200+ networks | 30 calls a minute (third-party) | Same company as CoinGecko, so check combined limits |
| Next | **DefiLlama** | Protocol TVL, stablecoins, DEX volume, fees, token prices | No key, about 500 requests per 5 min (third-party) | One source says the **Yields endpoint is Pro-only ($300 a month)**. Verify before promising a yields page |
| Next | **OpenSea API v2** | Ethereum and EVM NFT stats, floors | Free key: 60 read requests a minute (third-party) | One source says free keys expire after 30 days. Confirm |
| Next | Magic Eden Solana | NFTs (already in use) | 120 queries a minute per IP without a key (official-adjacent) | Fine. Cache aggressively |
| Later | Hyperliquid info API | Perp markets, funding rates | No key (third-party) | Good for a derivatives page |
| Later | DefiLlama emissions | Token unlocks | No key (third-party) | Distinct, searchable content |
| Later | News RSS feeds | Headlines | n/a | Link out only. Don't republish full text |
| Later | Tensor, Alchemy NFT, Helius | More NFT and Solana depth | (unverified) | Check free tiers first |

**Rule for every source:** one adapter file that returns a normalized type and never throws (your current pattern is good). Store results in Supabase with `fetched_at`. Let the UI show "updated 3 min ago" so staleness is visible rather than hidden.

**Legal and terms.** Displaying data with attribution is fine. Reselling API access is not (CoinGecko forbids it). Put a Data Sources page and per-page "Data provided by..." credits in place from day one.

---

## 4. Gemini (the free AI layer)

**Facts.**
- The free tier needs no card. Flash-class models are free. Rate limits vary by model and change over time, so read your actual numbers in Google AI Studio (the official docs page doesn't print them). Third-party figures for Flash are about 15 requests a minute and 1,500 a day. Pro models have moved on and off the free tier during 2026.
- On the free tier, **Google may use your prompts and responses to improve its products** (third-party, several sources). Send only public market data and never user personal data.

**Use it where it can't leak private data or hallucinate numbers:**
1. **Daily market brief.** One generation a day, stored, shown on the homepage and archived at `/briefs/2026-10-07`. That is a new indexable page every day, and it costs one request.
2. **Per-asset explainers** for the top assets, generated once and refreshed weekly from structured facts you pass in (price, 7-day change, TVL, upcoming unlocks).
3. **Prediction-market plain-English summaries.** Turn "Will X happen by Y?" into context, with the odds shown from real data.
4. **Natural-language alerts.** "Tell me when ETH drops 10% in a day" becomes a rule, replacing the strict `/setalert BTC above 70000` regex in `lib/telegram/bot.ts`. Validate the output against a schema before saving a rule.
5. **Ask NEXUS** search box. Gemini picks which of your own endpoints to query. Keep it behind a per-user daily cap.

**Guardrails.**
- Cache every generation. Never call Gemini per page view.
- Pass the numbers in the prompt and tell the model to use only those. Have your code insert the figures, not the model.
- Label AI text clearly and add "not financial advice". Crypto is treated as YMYL by Google (see 5.3).
- Add a fallback so features degrade to no AI text rather than breaking when quota runs out.

---

## 5. SEO strategy

### 5.1 What works and what will hurt
- Programmatic pages (Coinbase-style "convert X to Y" and per-asset pages) do rank, but Google's **scaled content abuse** policy targets many pages that exist mainly to rank. It applies whether pages are written by humans, AI, or templates, and enforcement was active in 2026 (several third-party write-ups on the August 2026 spam update).
- The safe rule: **every indexable page must have data or analysis a visitor can't get by swapping a name into a template.** A page with only a price and a title will be treated as thin.

### 5.2 Page plan (grow in stages, don't launch 50,000 pages)

| Stage | Pages | Indexable? |
|---|---|---|
| 1 | Home, Markets, New Listings, NFT, Predictions, About, Methodology, Data Sources | Yes |
| 2 | `/price/[coin]` for the top 100 to 200 coins. Include price, chart, 24h/7d/30d change, market cap, DEX pairs, TVL, related prediction markets, AI explainer, FAQ | Yes |
| 3 | `/nft/[collection]` for the top 100 collections, `/predictions/[slug]` for markets above a volume threshold, `/briefs/[date]` | Yes |
| 4 | Comparisons ("ETH vs SOL"), "biggest gainers today", "new tokens this week", glossary and guides | Yes, if each has unique analysis |
| 5 | Long tail (thousands of tokens) | `noindex` until a page has enough unique content, then flip it on |

### 5.3 Because crypto is YMYL
Google holds financial content to a higher standard. You need:
- An **About** page with real people or a real entity behind the site, a **Methodology** page (where data comes from, how often it updates), and a **Disclaimer**.
- Visible "last updated" times and source credits on every page.
- No claims you can't back. Your codebase already follows this ("labeled recent activity, never claimed live"), so keep that voice on the public pages too.

### 5.4 Technical checklist (Next.js)
- `app/sitemap.ts` with `generateSitemaps` when you pass 50,000 URLs (Google's per-file limit), plus `robots.ts`.
- `generateMetadata` per page with unique titles and descriptions, `alternates.canonical`, and Open Graph images (`opengraph-image.tsx`) so shares look good.
- JSON-LD: `BreadcrumbList` and `Organization` are safe. I would not count on rich results for prices, and FAQ rich results are limited by Google these days (unverified, so check the current docs).
- Server-render the data and keep pages fast (the current ISR approach is right). The WebSocket pieces are client islands, so crawlers see seeded values, which is correct.
- Verify the site in **Google Search Console** and **Bing Webmaster Tools** on day one, and submit the sitemap as soon as stage 1 is live. Don't wait for the build to finish.
- Per `AGENTS.md`, this Next.js version differs from older ones. Read the relevant guide in `node_modules/next/dist/docs/` before touching sitemap, metadata, or caching APIs.

### 5.5 Getting traffic before the build is done
1. Ship stage 1 and 2 as soon as data is reliable (after the section 1 fixes), not at the end.
2. Publish the daily AI brief from day one, so Google sees a site that updates daily.
3. Tools that earn links and repeat visits: price alerts, a converter with a real calculator, a "new listings today" feed.
4. A Telegram channel that posts the daily brief, and X posts of top movers. Both are free and drive return visits. (Channel results are my expectation, not researched.)
5. Be realistic: a new domain in a crowded YMYL niche usually takes months to rank. Plan for stage 2 pages to take time, and measure with Search Console rather than guessing.

---

## 6. Accounts, admin, and analytics

### 6.1 User login
- **Supabase Auth**: email magic link and Google sign-in, 50,000 monthly active users free (third-party). It lives next to your data and works with RLS.
- What logged-in users get: saved watchlist, synced alerts (replacing the Telegram deep-link flow as the only identity), preferences, and later a portfolio view.
- Use `@supabase/ssr` for cookie sessions in the App Router. (Check the current package name in Supabase docs.)

### 6.2 Admin area (`/admin`)
- Role stored in `app_metadata` (a custom claim), checked in server code and again in RLS policies. Never trust a client-side flag.
- Block `/admin` and `/api/admin/*` at the server, not just by hiding links.
- **Important:** your migration comment says "add RLS before ever exposing these tables to an anon key." Once users log in, enable RLS on every table and write explicit policies first.

**What the admin panel should show:**
- Traffic: visitors, top pages, referrers, search queries (from Search Console), conversions (signups, alerts created).
- Business: signups, active alert rules, Telegram subscribers, Gemini usage vs. daily cap.
- System health: last poll time, per-source success rate, CoinGecko credits used this month, Supabase DB size. This is where `poll_runs` pays off.

### 6.3 Analytics tooling
- **PostHog Cloud**: 1M events a month free (third-party) with product analytics and funnels. Good default because it also handles feature flags.
- **Umami / Plausible** are free if self-hosted, but you'd need a server for them, which isn't free on your current stack.
- **Google Search Console** is free and is the main tool for SEO progress. It has an API you can pull into the admin page.
- Add a cookie banner only if the tool you choose sets cookies and you serve EU users.

Recommendation: PostHog for behavior, Search Console for SEO, `poll_runs` plus Supabase counts for your own system view.

---

## 7. Roadmap

**Phase 0: Make the foundation honest (do first, about 1 week)**
1. Get a CoinGecko Demo key. Change pages to read from Supabase, not upstream.
2. Tier the poll schedule. Add `poll_runs` logging.
3. Remove the Reservoir module. Add CoinPaprika as a price fallback.
4. Move the clock to Cloudflare Workers Cron, keep GitHub Actions as backup.
5. Add price-feed failover and show the active source.
6. Add attribution, Data Sources, About, Methodology, and Disclaimer pages.
7. Commit or finish the NFT detail pages already in progress.

**Phase 1: SEO base (weeks 2 to 3)**
`sitemap.ts`, `robots.ts`, canonical and Open Graph metadata, Search Console and Bing verification, `/price/[coin]` for the top 100, the first daily brief.

**Phase 2: Accounts and admin (weeks 3 to 5)**
Supabase Auth, RLS on all tables, watchlist, alert management in-site, `/admin` with traffic and health.

**Phase 3: Breadth (weeks 5 to 8)**
GeckoTerminal and DefiLlama (protocols, TVL, stablecoins, DEX volume), OpenSea for EVM NFTs, token pages that cross-link all modules, unified search.

**Phase 4: AI layer and growth (weeks 8 and on)**
Gemini explainers and natural-language alerts, Ask NEXUS, Hyperliquid and token unlocks, comparison pages, Telegram channel.

**Phase 5: Monetization decision**
Move to Vercel Pro or Cloudflare and CoinGecko Basic before turning on ads or paid features.

---

## 8. Open questions for you
1. Will you monetize, and when? It decides the hosting and API plan.
2. Is the first audience global or specific (for example Nigeria or Africa)? It affects which exchange feeds and which keywords to target.
3. Do you want Solana only, or Ethereum NFTs from the start? EVM needs the OpenSea key.
4. Is there a real NEX token planned? Nothing in the code uses one today.

## Sources
- [CoinGecko API plans](https://www.coingecko.com/en/api/pricing)
- [Polymarket rate limits](https://docs.polymarket.com/api-reference/rate-limits)
- [Binance market-data-only URLs](https://developers.binance.com/docs/binance-spot-api-docs/faqs/market_data_only)
- [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [GeckoTerminal API guide](https://apiguide.geckoterminal.com/faq)
- [Supabase RBAC and custom claims](https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac)
- [Next.js generateSitemaps](https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps)
- Third-party, cross-checked where possible: Supabase and Vercel pricing guides (costbench, jetadmin, deploywise), Magic Eden rate limits (apis.io), Reservoir shutdown (cryptonews.net), GitHub Actions cron reliability (GitHub community, itime.day), Cloudflare limits and free-tier comparisons (costbench, agentdeals), analytics comparisons (agentdeals), scaled content abuse and August 2026 spam update (ppc.land, gsqi.com), CoinPaprika (coinpaprika.com), DefiLlama (eco.com, api-evangelist).
