import type { CrowdStrike } from "@/lib/data-sources/polymarket";

/** The crowd's chance that the price ends ABOVE `price`, linearly
 * interpolated between the two surrounding strikes. Outside the strike
 * range it holds the nearest strike's value (those tails are ~0% or ~100%). */
export function probAbove(strikes: CrowdStrike[], price: number): number {
  if (!strikes.length) return 0;
  if (price <= strikes[0].strike) return strikes[0].pAbove;
  const last = strikes[strikes.length - 1];
  if (price >= last.strike) return last.pAbove;
  for (let i = 0; i < strikes.length - 1; i++) {
    const lo = strikes[i];
    const hi = strikes[i + 1];
    if (price >= lo.strike && price <= hi.strike) {
      const t = (price - lo.strike) / (hi.strike - lo.strike);
      return lo.pAbove + (hi.pAbove - lo.pAbove) * t;
    }
  }
  return last.pAbove;
}

/** The price the crowd thinks is a coin-flip: where P(above) crosses 50%.
 * Null when the strikes don't bracket 50% (all above or all below). */
export function crowdMedian(strikes: CrowdStrike[]): number | null {
  for (let i = 0; i < strikes.length - 1; i++) {
    const lo = strikes[i];
    const hi = strikes[i + 1];
    if (lo.pAbove >= 0.5 && hi.pAbove <= 0.5) {
      if (lo.pAbove === hi.pAbove) return lo.strike;
      const t = (lo.pAbove - 0.5) / (lo.pAbove - hi.pAbove);
      return lo.strike + (hi.strike - lo.strike) * t;
    }
  }
  return null;
}
