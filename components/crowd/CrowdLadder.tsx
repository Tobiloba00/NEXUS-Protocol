"use client";

import { Fragment, useMemo } from "react";
import { LiveStatusChip } from "@/components/status/LiveStatusChip";
import { useLiveTicker } from "@/lib/exchanges/useLiveTicker";
import { usePolled } from "@/lib/live/usePolled";
import { crowdMedian, probAbove } from "@/lib/crowd/ladder-math";
import { fetchCrowdLadder, type CrowdLadderData } from "@/lib/data-sources/polymarket";

const REFRESH_MS = 20000;

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const pct = (p: number) => `${Math.round(p * 100)}%`;
const compactUsd = (n: number) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n.toFixed(0)}`;

function formatSettle(iso: string) {
  // Fixed locale + UTC so server and browser render identical text.
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}, ${d.toLocaleTimeString(
    "en-US",
    { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }
  )} UTC`;
}

/**
 * "What the crowd expects": Polymarket's strike-price odds for today/tomorrow
 * drawn as a ladder, with the live exchange price marked on it. Combines two
 * sources nobody puts on one screen — a live price and a prediction market —
 * into numbers neither shows alone (the crowd's median, and the chance of
 * finishing above wherever the price is right now).
 *
 * Renders nothing when no suitable market exists for the asset.
 */
export function CrowdLadder({
  initial,
  symbol,
  base,
}: {
  initial: CrowdLadderData | null;
  symbol: string;
  base: string;
}) {
  if (!initial) return null;
  return <Ladder initial={initial} symbol={symbol} base={base} />;
}

function Ladder({ initial, symbol, base }: { initial: CrowdLadderData; symbol: string; base: string }) {
  const { data, status } = usePolled(
    async () => {
      const fresh = await fetchCrowdLadder(initial.asset);
      if (!fresh) throw new Error("no ladder returned"); // keep the last odds on screen
      return fresh;
    },
    initial,
    REFRESH_MS
  );
  const { price: live } = useLiveTicker(symbol);

  const view = useMemo(() => {
    // Hide the boring tails (≈0% / ≈100%) but keep one row of context each side.
    const strikes = data.strikes;
    const first = strikes.findIndex((s) => s.pAbove < 0.985);
    const lastIdx = strikes.length - 1 - [...strikes].reverse().findIndex((s) => s.pAbove > 0.015);
    const from = Math.max(0, first - 1);
    const to = Math.min(strikes.length - 1, lastIdx + 1);
    const shown = (first === -1 || lastIdx < 0 ? strikes : strikes.slice(from, to + 1)).slice().reverse(); // high → low
    return { shown, median: crowdMedian(strikes) };
  }, [data.strikes]);

  const pAtLive = live !== null ? probAbove(data.strikes, live) : null;
  // Index (in the high→low list) before which the live marker is drawn.
  const markerBefore = live !== null ? view.shown.findIndex((s) => s.strike <= live) : -1;

  return (
    <section>
      <div className="mb-3 flex min-h-[34px] items-center justify-between gap-3 px-1">
        <h2 className="t-title">What the crowd expects</h2>
        <LiveStatusChip status={status} source="Polymarket" />
      </div>

      <div className="group-card p-5 sm:p-6">
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <dt className="text-[13px] text-ink-400">Crowd median</dt>
            <dd className="mt-1 text-[28px] font-bold leading-none tracking-[-0.035em] tabular-nums">
              {view.median !== null ? usd(view.median) : "—"}
            </dd>
            <p className="mt-1.5 text-[12.5px] text-ink-400">A coin-flip price for {base} at settlement</p>
          </div>
          <div>
            <dt className="text-[13px] text-ink-400">Chance above {live !== null ? usd(live) : "now"}</dt>
            <dd className="mt-1 text-[28px] font-bold leading-none tracking-[-0.035em] tabular-nums">
              {pAtLive !== null ? pct(pAtLive) : "—"}
            </dd>
            <p className="mt-1.5 text-[12.5px] text-ink-400">Of finishing higher than the live price</p>
          </div>
          <div>
            <dt className="text-[13px] text-ink-400">Settles</dt>
            <dd className="mt-1 text-[28px] font-bold leading-none tracking-[-0.035em]">
              <span suppressHydrationWarning>{formatSettle(data.endsAt)}</span>
            </dd>
            <p className="mt-1.5 text-[12.5px] text-ink-400">{data.volumeUsd !== null ? `${compactUsd(data.volumeUsd)} traded` : "Polymarket"}</p>
          </div>
        </dl>

        <div className="mt-6 flex flex-col gap-1" role="list" aria-label={`Chance ${base} finishes above each price`}>
          {view.shown.map((s, i) => {
            const nearest =
              live !== null &&
              Math.abs(s.strike - live) === Math.min(...view.shown.map((x) => Math.abs(x.strike - live)));
            return (
              <Fragment key={s.strike}>
                {markerBefore === i && <LiveMarker price={live!} />}
                <div role="listitem" className="flex items-center gap-3">
                  <span className={`w-[76px] shrink-0 text-right text-[13.5px] tabular-nums ${nearest ? "font-semibold text-ink-50" : "text-ink-300"}`}>
                    {usd(s.strike)}
                  </span>
                  <div className="h-[10px] flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={`h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${nearest ? "bg-accent" : "bg-accent/55"}`}
                      style={{ width: `${Math.max(0.5, s.pAbove * 100)}%` }}
                    />
                  </div>
                  <span className={`w-[44px] shrink-0 text-[14px] font-semibold tabular-nums tracking-[-0.01em] ${nearest ? "text-ink-50" : "text-ink-300"}`}>
                    {pct(s.pAbove)}
                  </span>
                </div>
              </Fragment>
            );
          })}
          {live !== null && markerBefore === -1 && <LiveMarker price={live} />}
        </div>

        <p className="mt-5 text-[12.5px] leading-snug text-ink-400">
          Each bar is the market&apos;s chance that {base} finishes <em className="not-italic font-medium text-ink-300">above</em> that price
          at settlement.{" "}
          <a href={data.link} target="_blank" rel="noopener noreferrer" className="font-medium text-accent">
            Polymarket ↗
          </a>{" "}
          · Information only, not financial advice.
        </p>
      </div>
    </section>
  );
}

function LiveMarker({ price }: { price: number }) {
  return (
    <div className="my-2.5 flex items-center gap-3" aria-label={`Live price ${usd(price)}`}>
      <span className="w-[76px] shrink-0" />
      <div className="relative flex-1">
        <div className="border-t border-dashed border-accent" />
        <span className="absolute -top-[11px] left-0 rounded-full bg-accent px-2.5 py-[2px] text-[11.5px] font-semibold tabular-nums text-white shadow-sm">
          Live {usd(price)}
        </span>
      </div>
      <span className="w-[44px] shrink-0" />
    </div>
  );
}
