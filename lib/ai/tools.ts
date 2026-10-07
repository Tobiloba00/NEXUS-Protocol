import { getMarkets, getNewListings, getNftCollections, getPredictionMarkets } from "@/lib/data/cache";
import { fetchGlobalStats, fetchFearGreed } from "@/lib/data-sources/global-stats";
import { fetchCrowdLadder } from "@/lib/data-sources/polymarket";
import { crowdMedian, probAbove } from "@/lib/crowd/ladder-math";
import { assessRisk } from "@/lib/risk/score";
import { fetchNews } from "@/lib/data-sources/news";
import { fetchBinanceListings } from "@/lib/data-sources/exchange-listings";
import { fetchCollectionActivity, fetchCollectionStats } from "@/lib/data-sources/magiceden";

/**
 * The only things the AI can see. Each tool reads NEXUS's own data layer
 * (the same cache the pages use) and returns small, plain JSON — the model
 * is instructed to answer strictly from these results, so it can't invent a
 * price it was never given. Adding a capability to the assistant = adding a
 * tool here.
 */

export const TOOL_DECLARATIONS = [
  {
    name: "get_market_overview",
    description:
      "Whole-crypto-market snapshot: total market cap and its 24h change, 24h volume, Bitcoin dominance, and the Fear & Greed index.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "get_coin",
    description:
      "Price, 24h change and market cap for one coin from the top 100 by market cap. Look up by ticker symbol (BTC) or name (Bitcoin).",
    parameters: {
      type: "OBJECT",
      properties: { query: { type: "STRING", description: "Ticker symbol or coin name, e.g. SOL or Solana" } },
      required: ["query"],
    },
  },
  {
    name: "get_top_movers",
    description: "The biggest 24h gainers or losers among the top 100 coins (stablecoins excluded).",
    parameters: {
      type: "OBJECT",
      properties: {
        direction: { type: "STRING", description: "'gainers' or 'losers'" },
        limit: { type: "INTEGER", description: "How many to return (1-10, default 5)" },
      },
      required: ["direction"],
    },
  },
  {
    name: "get_new_listings",
    description:
      "Newest tokens on decentralized exchanges, each with a heuristic risk rating (low / medium / high) and its main reasons, liquidity, age and price change. Use for questions about new tokens or whether something looks risky.",
    parameters: {
      type: "OBJECT",
      properties: {
        chain: { type: "STRING", description: "Optional chain filter, e.g. 'solana', 'ethereum', 'base', 'bsc'" },
        sort: { type: "STRING", description: "'newest' (default) or 'lowest_risk' — use lowest_risk for questions about which tokens look safer" },
        limit: { type: "INTEGER", description: "How many to return (1-15, default 8)" },
      },
    },
  },
  {
    name: "get_prediction_markets",
    description:
      "Top Polymarket prediction markets by trading volume, with each outcome's current probability. Use for questions about what the crowd expects politically or about events.",
    parameters: {
      type: "OBJECT",
      properties: { limit: { type: "INTEGER", description: "How many to return (1-10, default 6)" } },
    },
  },
  {
    name: "get_crowd_price_odds",
    description:
      "Polymarket's crowd odds for where Bitcoin, Ethereum or Solana will finish at the next daily settlement: the crowd's median price and the chance of finishing above chosen price levels, compared with the current price.",
    parameters: {
      type: "OBJECT",
      properties: { asset: { type: "STRING", description: "'Bitcoin', 'Ethereum' or 'Solana'" } },
      required: ["asset"],
    },
  },
  {
    name: "get_nft_collection",
    description:
      "Deeper look at ONE NFT collection: floor price, how many are listed, average price over 24h, 7-day volume and its most recent on-chain sales and bids. Find it by name (for example Stonk Inus) or by Magic Eden slug.",
    parameters: {
      type: "OBJECT",
      properties: { query: { type: "STRING", description: "Collection name or slug" } },
      required: ["query"],
    },
  },
  {
    name: "get_news",
    description:
      "Latest crypto news headlines (title, outlet, time) from CoinDesk, Cointelegraph, Decrypt, The Block and Bitcoin Magazine. Headlines only, no article text.",
    parameters: {
      type: "OBJECT",
      properties: { limit: { type: "INTEGER", description: "How many headlines (1-15, default 8)" } },
    },
  },
  {
    name: "get_exchange_listings",
    description: "Coins that Binance has just announced it will list or launch, with the ticker each one lists as.",
    parameters: {
      type: "OBJECT",
      properties: { limit: { type: "INTEGER", description: "How many announcements (1-10, default 6)" } },
    },
  },
  {
    name: "get_nft_collections",
    description: "Top active NFT collections (Solana, via Magic Eden) with floor price and 7-day volume.",
    parameters: {
      type: "OBJECT",
      properties: { limit: { type: "INTEGER", description: "How many to return (1-10, default 6)" } },
    },
  },
] as const;

export type ToolName = (typeof TOOL_DECLARATIONS)[number]["name"];

const clamp = (n: unknown, min: number, max: number, fallback: number) => {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;
};
const round = (n: number | null | undefined, digits = 4) =>
  n === null || n === undefined ? null : Number(n.toPrecision(digits + 2));

export async function runTool(name: string, args: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  switch (name) {
    case "get_market_overview": {
      const [stats, fg] = await Promise.all([fetchGlobalStats(), fetchFearGreed()]);
      return {
        totalMarketCapUsd: stats.totalMarketCapUsd,
        marketCapChange24hPct: round(stats.marketCapChangePct24h, 2),
        volume24hUsd: stats.totalVolumeUsd,
        btcDominancePct: round(stats.btcDominancePct, 3),
        fearGreed: fg ? { value: fg.value, label: fg.classification } : null,
      };
    }

    case "get_coin": {
      const q = String(args.query ?? "").trim().toLowerCase();
      if (!q) return { error: "query is required" };
      const { data, fetchedAt } = await getMarkets(100);
      const hit =
        data.find((c) => c.symbol.toLowerCase() === q) ??
        data.find((c) => c.name.toLowerCase() === q) ??
        data.find((c) => c.name.toLowerCase().includes(q));
      if (!hit) return { found: false, note: "Not in the top 100 coins by market cap." };
      return {
        found: true,
        name: hit.name,
        symbol: hit.symbol,
        priceUsd: hit.priceUsd,
        change24hPct: round(hit.change24hPct, 3),
        marketCapUsd: hit.marketCapUsd,
        dataAsOf: fetchedAt ?? "live fetch",
      };
    }

    case "get_top_movers": {
      const limit = clamp(args.limit, 1, 10, 5);
      const gainers = String(args.direction).toLowerCase().startsWith("g");
      const { data, fetchedAt } = await getMarkets(100);
      const rows = data
        .filter((c) => c.change24hPct !== null)
        // Pegged stablecoins aren't movers.
        .filter((c) => !(c.priceUsd !== null && c.priceUsd > 0.95 && c.priceUsd < 1.05 && Math.abs(c.change24hPct ?? 0) < 1))
        .sort((a, b) => (gainers ? 1 : -1) * ((b.change24hPct ?? 0) - (a.change24hPct ?? 0)))
        .slice(0, limit);
      return {
        direction: gainers ? "gainers" : "losers",
        dataAsOf: fetchedAt ?? "live fetch",
        coins: rows.map((c) => ({ symbol: c.symbol, name: c.name, priceUsd: c.priceUsd, change24hPct: round(c.change24hPct, 3) })),
      };
    }

    case "get_new_listings": {
      const limit = clamp(args.limit, 1, 15, 8);
      const chain = typeof args.chain === "string" ? args.chain.toLowerCase() : null;
      const { data } = await getNewListings(30);
      const now = Date.now();
      let pool = data.filter((l) => !chain || l.chain?.toLowerCase() === chain);
      if (String(args.sort).toLowerCase() === "lowest_risk") {
        pool = [...pool].sort((a, b) => (assessRisk(a, now)?.score ?? 100) - (assessRisk(b, now)?.score ?? 100));
      }
      const rows = pool.slice(0, limit);
      return {
        note: "Risk ratings are an automated heuristic from trading data, not a safety guarantee.",
        listings: rows.map((l) => {
          const risk = assessRisk(l, now);
          return {
            symbol: l.symbol,
            name: l.name,
            chain: l.chain,
            ageMinutes: l.pairCreatedAt ? Math.round((now - l.pairCreatedAt) / 60_000) : null,
            priceUsd: l.priceUsd,
            change24hPct: round(l.change24hPct, 3),
            liquidityUsd: l.liquidityUsd,
            risk: risk ? { level: risk.level, score: risk.score, reasons: risk.reasons.filter((r) => r.kind !== "good").slice(0, 3).map((r) => r.text) } : null,
          };
        }),
      };
    }

    case "get_prediction_markets": {
      const limit = clamp(args.limit, 1, 10, 6);
      const { data } = await getPredictionMarkets(40);
      const rows = [...data].sort((a, b) => (b.volumeUsd ?? 0) - (a.volumeUsd ?? 0)).slice(0, limit);
      return {
        markets: rows.map((m) => ({
          question: m.question,
          volumeUsd: m.volumeUsd,
          ends: m.endDate,
          outcomes: m.outcomes.map((o) => ({ label: o.label, probabilityPct: o.probability !== null ? Math.round(o.probability * 100) : null })),
        })),
      };
    }

    case "get_crowd_price_odds": {
      const asset = ["Bitcoin", "Ethereum", "Solana"].find((a) => a.toLowerCase() === String(args.asset).trim().toLowerCase());
      if (!asset) return { error: "asset must be Bitcoin, Ethereum or Solana" };
      const [ladder, { data: markets }] = await Promise.all([fetchCrowdLadder(asset), getMarkets(100)]);
      if (!ladder) return { available: false, note: "No liquid daily prediction market for this asset right now." };
      const spot = markets.find((c) => c.name.toLowerCase() === asset.toLowerCase())?.priceUsd ?? null;
      return {
        available: true,
        settles: ladder.endsAt,
        volumeUsd: ladder.volumeUsd,
        referencePriceUsd: spot,
        crowdMedianUsd: round(crowdMedian(ladder.strikes), 6),
        chanceAboveReferencePricePct: spot !== null ? Math.round(probAbove(ladder.strikes, spot) * 100) : null,
        chanceFinishingAboveLevelPct: ladder.strikes.map((s) => ({ level: s.strike, chancePct: Math.round(s.pAbove * 100) })),
      };
    }

    case "get_nft_collections": {
      const limit = clamp(args.limit, 1, 10, 6);
      const { data } = await getNftCollections(20);
      return {
        collections: data.slice(0, limit).map((c) => ({ name: c.name, chain: c.chain, floor: c.floorPrice, currency: c.currency, volume7d: round(c.volume7d, 4) })),
      };
    }

    case "get_nft_collection": {
      const q = String(args.query ?? "").trim().toLowerCase();
      if (!q) return { error: "query is required" };
      const { data } = await getNftCollections(40);
      const hit =
        data.find((c) => c.slug?.toLowerCase() === q) ??
        data.find((c) => c.name.toLowerCase() === q) ??
        data.find((c) => c.name.toLowerCase().includes(q));
      if (!hit?.slug) return { found: false, note: "That collection isn't among the tracked active collections." };
      const [stats, activity] = await Promise.all([fetchCollectionStats(hit.slug), fetchCollectionActivity(hit.slug, 12)]);
      const sales = activity.filter((a) => a.type === "buyNow" && a.price !== null);
      return {
        found: true,
        name: hit.name,
        currency: "SOL",
        floor: round(stats.floorPrice, 4),
        listedCount: stats.listedCount,
        avgPrice24h: round(stats.avgPrice24h, 4),
        volume7d: round(stats.volume7d, 4),
        recentSales: sales.slice(0, 6).map((a) => ({
          price: a.price,
          secondsAgo: a.blockTime ? Math.round(Date.now() / 1000 - a.blockTime) : null,
        })),
        recentEventCounts: activity.reduce<Record<string, number>>((acc, a) => {
          acc[a.type] = (acc[a.type] ?? 0) + 1;
          return acc;
        }, {}),
      };
    }

    case "get_news": {
      const limit = clamp(args.limit, 1, 15, 8);
      const news = await fetchNews(limit);
      return { headlines: news.map((n) => ({ title: n.title, outlet: n.source, publishedAt: n.publishedAt })) };
    }

    case "get_exchange_listings": {
      const limit = clamp(args.limit, 1, 10, 6);
      const rows = await fetchBinanceListings();
      return {
        announcements: rows.slice(0, limit).map((l) => ({ title: l.title, tickers: l.tickers, kind: l.kind, publishedAt: l.publishedAt })),
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
