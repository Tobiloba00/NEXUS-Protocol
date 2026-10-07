import type { Listing } from "@/lib/data-sources/types";

/**
 * Transparent risk heuristic for brand-new DEX tokens. It is deliberately
 * simple and explainable: every point of score comes with a plain-language
 * reason shown to the user. It flags the common red flags (thin liquidity,
 * one-sided trading, extreme valuation vs. liquidity, dumped price, no web
 * presence). It is NOT a safety guarantee — a "lower risk" token can still
 * be a scam, which the UI says out loud.
 */

export type RiskLevel = "low" | "medium" | "high";

export type RiskReason = {
  kind: "bad" | "warn" | "good";
  text: string;
};

export type RiskAssessment = {
  level: RiskLevel;
  score: number; // 0 (fine) .. 100 (worst)
  reasons: RiskReason[];
};

const usd = (n: number) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n.toFixed(0)}`;

/** Returns null when the row has no signals (older cached rows) — callers
 * simply show no badge rather than guessing. */
export function assessRisk(l: Listing, now = Date.now()): RiskAssessment | null {
  const s = l.signals;
  if (!s) return null;

  let score = 0;
  const reasons: RiskReason[] = [];
  const add = (points: number, kind: RiskReason["kind"], text: string) => {
    score += points;
    reasons.push({ kind, text });
  };

  // --- Liquidity: how much real money backs the price -------------------
  const liq = l.liquidityUsd;
  if (liq === null) add(10, "warn", "No liquidity pool data yet — common for tokens still on a launchpad curve");
  else if (liq < 5_000) add(35, "bad", `Very thin liquidity (${usd(liq)}) — easy to manipulate, hard to sell`);
  else if (liq < 20_000) add(20, "warn", `Thin liquidity (${usd(liq)})`);
  else if (liq < 50_000) add(8, "warn", `Modest liquidity (${usd(liq)})`);
  else reasons.push({ kind: "good", text: `Healthy liquidity (${usd(liq)})` });

  // --- Sellability: honeypots show buys with (almost) no sells ----------
  if (s.buys1h >= 20 && s.sells1h === 0) {
    add(35, "bad", `${s.buys1h} buys but zero sells in the last hour — possible honeypot (can't sell)`);
  } else if (s.buys1h >= 50 && s.sells1h / s.buys1h < 0.1) {
    add(20, "warn", "Almost nobody is selling — unusual, can signal restricted selling");
  } else if (s.buys1h + s.sells1h >= 30) {
    reasons.push({ kind: "good", text: "Two-way trading: both buys and sells are happening" });
  }

  // --- Price action ------------------------------------------------------
  const change24 = l.change24hPct;
  if (change24 !== null && change24 <= -70) add(25, "bad", `Price down ${Math.abs(change24).toFixed(0)}% — possible dump or rug`);
  else if (change24 !== null && change24 <= -40) add(16, "warn", `Price down ${Math.abs(change24).toFixed(0)}% since launch — sellers are dumping`);
  else if (s.change1hPct !== null && s.change1hPct >= 300) add(8, "warn", `Up ${s.change1hPct.toFixed(0)}% in the last hour — extreme pump`);

  // Heavy recent selling even if the price hasn't collapsed yet.
  if (s.sells1h >= 30 && s.sells1h > s.buys1h * 1.5) add(10, "warn", "Sells are outpacing buys by a wide margin right now");

  // --- Valuation vs. liquidity ------------------------------------------
  if (s.fdvUsd !== null && liq !== null && liq > 0 && s.fdvUsd / liq > 200) {
    add(12, "warn", `Valuation is ${Math.round(s.fdvUsd / liq)}× its liquidity — a few sells could crash the price`);
  }
  if (s.volume24hUsd !== null && liq !== null && liq > 0 && s.volume24hUsd / liq > 50) {
    add(8, "warn", "Trading volume is far larger than liquidity — can indicate wash trading");
  }

  // --- Age ---------------------------------------------------------------
  if (l.pairCreatedAt) {
    const mins = (now - l.pairCreatedAt) / 60_000;
    if (mins < 30) add(15, "warn", "Under 30 minutes old — too new to judge");
    else if (mins < 120) add(8, "warn", "Under 2 hours old");
  }

  // --- Presence ----------------------------------------------------------
  if (!s.hasSocials && !s.hasWebsite) add(10, "warn", "No website or social links listed");
  else reasons.push({ kind: "good", text: "Has a website or social links" });

  score = Math.min(100, score);
  const level: RiskLevel = score >= 45 ? "high" : score >= 25 ? "medium" : "low";

  // Worst reasons first.
  const order = { bad: 0, warn: 1, good: 2 } as const;
  reasons.sort((a, b) => order[a.kind] - order[b.kind]);
  return { level, score, reasons };
}

export const RISK_LABEL: Record<RiskLevel, string> = {
  low: "Lower risk",
  medium: "Caution",
  high: "High risk",
};
