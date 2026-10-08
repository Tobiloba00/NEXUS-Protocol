/**
 * NEXUS's own AI mark, small: the brand "N" drawn as a network (four nodes
 * joined by lines). Uses currentColor, so it takes the colour of its context.
 * Deliberately not a sparkle/star — that shape belongs to other AI products.
 */
export function NexusMark({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M6.5 18V6l11 12V6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      {[
        [6.5, 18],
        [6.5, 6],
        [17.5, 18],
        [17.5, 6],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.1" fill="currentColor" />
      ))}
    </svg>
  );
}
