/** 24h change as a tinted capsule (green/red), the way iOS Stocks shows it.
 * Fixed min-width keeps a column of pills aligned as digits change. */
export function ChangePill({
  pct,
  digits = 2,
  className = "",
}: {
  pct: number | null | undefined;
  digits?: number;
  className?: string;
}) {
  if (pct === null || pct === undefined) {
    return <span className={`text-[13px] text-ink-500 ${className}`}>—</span>;
  }
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex min-w-[64px] items-center justify-center rounded-full px-2 py-[3px] text-[12.5px] font-semibold tabular-nums tracking-[-0.01em] ${
        up ? "bg-pos-soft text-pos" : "bg-neg-soft text-neg"
      } ${className}`}
    >
      {up ? "+" : "−"}
      {Math.abs(pct).toFixed(digits)}%
    </span>
  );
}
