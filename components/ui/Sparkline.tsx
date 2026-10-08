/** A tiny trend line. Pure SVG (no JS), colored by direction over the period. */
export function Sparkline({
  data,
  width = 72,
  height = 28,
  className = "",
}: {
  data?: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  if (!data || data.length < 2) return <span style={{ width, height }} className={`inline-block ${className}`} aria-hidden />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 2;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const up = data[data.length - 1] >= data[0];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={`shrink-0 ${className}`} aria-hidden>
      <path d={line} fill="none" stroke={up ? "var(--pos)" : "var(--neg)"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
