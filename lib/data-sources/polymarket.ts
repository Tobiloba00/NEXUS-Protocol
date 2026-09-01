import type { PredictionMarket } from "./types";

/**
 * Polymarket Gamma API — fully public, keyless, confirmed working during
 * this rewrite. Read-only: markets/odds/volume display only, no wallet
 * connect or order placement (see plan's "display only" scope note — this
 * sidesteps gambling/money-transmission regulation entirely).
 *
 * outcomes/outcomePrices come back as JSON-encoded strings (not arrays),
 * confirmed via a real request — parsed defensively below since that's an
 * easy thing for Polymarket to change without notice.
 */

const BASE = "https://gamma-api.polymarket.com";

type GammaMarket = {
  slug: string;
  question: string;
  outcomes?: string; // JSON-encoded string array, e.g. '["Yes","No"]'
  outcomePrices?: string; // JSON-encoded string array of probabilities, e.g. '["0.04","0.96"]'
  volume?: string;
  liquidity?: string;
  endDate?: string;
};

function parseJsonArray(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function fetchActiveMarkets(limit = 50): Promise<PredictionMarket[]> {
  try {
    const res = await fetch(`${BASE}/markets?limit=${limit}&active=true&closed=false`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      console.warn(`[polymarket] markets ${res.status}`);
      return [];
    }
    const rows: GammaMarket[] = await res.json();

    return rows.map((r) => {
      const labels = parseJsonArray(r.outcomes);
      const prices = parseJsonArray(r.outcomePrices);
      return {
        slug: r.slug,
        question: r.question,
        outcomes: labels.map((label, i) => ({
          label,
          probability: prices[i] !== undefined ? Number(prices[i]) : null,
        })),
        volumeUsd: r.volume ? Number(r.volume) : null,
        liquidityUsd: r.liquidity ? Number(r.liquidity) : null,
        endDate: r.endDate ?? null,
        link: `https://polymarket.com/event/${r.slug}`,
      };
    });
  } catch (err) {
    console.warn("[polymarket] markets fetch failed", err);
    return [];
  }
}
