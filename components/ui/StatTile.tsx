export function StatTile({
  label,
  value,
  changePct,
  sub,
}: {
  label: string;
  value: string;
  changePct?: number | null;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl2 border border-line bg-surface p-4">
      <span className="text-[11px] font-medium uppercase tracking-wider text-ink-500">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-semibold tabular-nums">{value}</span>
        {changePct !== undefined && changePct !== null && (
          <span className={`text-xs font-medium ${changePct >= 0 ? "text-pos" : "text-neg"}`}>
            {changePct >= 0 ? "+" : ""}
            {changePct.toFixed(2)}%
          </span>
        )}
        {sub && <span className="text-xs text-ink-400">{sub}</span>}
      </div>
    </div>
  );
}
