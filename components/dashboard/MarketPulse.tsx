import { ChangePill } from "@/components/ui/ChangePill";

type GlobalStats = {
  totalMarketCapUsd: number | null;
  marketCapChangePct24h: number | null;
  totalVolumeUsd: number | null;
  btcDominancePct: number | null;
};
type FearGreed = { value: number; classification: string } | null;

function compactUsd(n: number | null) {
  if (n === null) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString("en-US")}`;
}

/** The whole-market numbers as a vertical grouped list: label on the left,
 * value on the right. Used in side panels, where the horizontal strip on the
 * home page would be too wide. */
export function MarketPulse({ stats, fearGreed }: { stats: GlobalStats; fearGreed: FearGreed }) {
  const rows: { label: string; value: string; extra?: React.ReactNode }[] = [
    {
      label: "Market cap",
      value: compactUsd(stats.totalMarketCapUsd),
      extra: stats.marketCapChangePct24h !== null ? <ChangePill pct={stats.marketCapChangePct24h} className="!min-w-0" /> : null,
    },
    { label: "24h volume", value: compactUsd(stats.totalVolumeUsd) },
    {
      label: "BTC dominance",
      value: stats.btcDominancePct !== null ? `${stats.btcDominancePct.toFixed(1)}%` : "—",
    },
    {
      label: "Fear & Greed",
      value: fearGreed ? String(fearGreed.value) : "—",
      extra: fearGreed ? <span className="text-[13px] text-ink-400">{fearGreed.classification}</span> : null,
    },
  ];

  return (
    <section>
      <h2 className="t-title mb-3 px-1">Market</h2>
      <dl className="group-card" style={{ "--sep-inset": "16px" } as React.CSSProperties}>
        {rows.map((r) => (
          <div key={r.label} className="list-row flex items-center justify-between gap-3 px-4 py-3.5">
            <dt className="text-[15px] text-ink-300">{r.label}</dt>
            <dd className="flex items-center gap-2.5">
              {r.extra}
              <span className="text-[17px] font-semibold tracking-[-0.02em] tabular-nums">{r.value}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
