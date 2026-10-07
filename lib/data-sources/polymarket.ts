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
  image?: string;
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
        image: r.image ?? null,
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

// ---------------------------------------------------------------------------
// Crowd price ladder: Polymarket's daily "<Asset> above ___ on <date>?" events
// carry ~11 strike prices, each priced as the market's probability that the
// asset finishes above that strike. Read together they form the crowd's
// expected distribution for the day — something no price site shows next to
// a live price. Public + CORS-open, so it also refreshes in the browser.
// ---------------------------------------------------------------------------

export type CrowdStrike = { strike: number; pAbove: number };

export type CrowdLadderData = {
  asset: string; // "Bitcoin"
  title: string;
  endsAt: string; // ISO
  volumeUsd: number | null;
  link: string;
  strikes: CrowdStrike[]; // ascending by strike
};

type GammaEvent = {
  title: string;
  slug: string;
  endDate: string;
  active?: boolean;
  closed?: boolean;
  volume?: number | string;
  markets?: (GammaMarket & { groupItemTitle?: string; closed?: boolean; active?: boolean })[];
};

/** Below this much traded volume the odds are too thin to be meaningful. */
const MIN_LADDER_VOLUME_USD = 5_000;

export async function fetchCrowdLadder(asset: string): Promise<CrowdLadderData | null> {
  try {
    const res = await fetch(
      `${BASE}/public-search?q=${encodeURIComponent(`${asset} above`)}&limit_per_type=20&events_status=active`,
      { headers: { accept: "application/json" } }
    );
    if (!res.ok) return null;
    const events: GammaEvent[] = (await res.json()).events ?? [];

    // Daily events only ("... on October 8?"), not hourly ones ("... 3PM ET?").
    // Written without backslashes on purpose (see tests in the PR notes).
    const titleRe = new RegExp(`^${asset} above ___ on [A-Za-z]+ [0-9]{1,2}[?]$`, "i");
    const now = Date.now();
    const event = events
      .filter((e) => titleRe.test(e.title) && e.active && !e.closed && new Date(e.endDate).getTime() > now)
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())[0];
    if (!event?.markets) return null;

    const volume = Number(event.volume);
    if (!Number.isFinite(volume) || volume < MIN_LADDER_VOLUME_USD) return null;

    const strikes: CrowdStrike[] = [];
    for (const m of event.markets) {
      if (m.closed || m.active === false) continue;
      const strike = Number(String(m.groupItemTitle ?? "").replace(/[^0-9.]/g, ""));
      const labels = parseJsonArray(m.outcomes);
      const prices = parseJsonArray(m.outcomePrices);
      const yes = labels.findIndex((l) => l.toLowerCase() === "yes");
      const p = yes >= 0 ? Number(prices[yes]) : NaN;
      if (Number.isFinite(strike) && strike > 0 && Number.isFinite(p)) strikes.push({ strike, pAbove: p });
    }
    if (strikes.length < 4) return null;
    strikes.sort((a, b) => a.strike - b.strike);

    return {
      asset,
      title: event.title,
      endsAt: event.endDate,
      volumeUsd: volume,
      link: `https://polymarket.com/event/${event.slug}`,
      strikes,
    };
  } catch (err) {
    console.warn(`[polymarket] crowd ladder (${asset}) failed`, err);
    return null;
  }
}
