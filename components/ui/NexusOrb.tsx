/**
 * The AI assistant's mark: a dark glass sphere with a soft teal glow, and the
 * NEXUS "N" drawn as a small network. A pulse of light travels along the
 * letter, node to node, like a signal being routed. Pure CSS/SVG (see
 * .nexus-orb in globals.css): no JavaScript, no image, honours reduced-motion.
 * Original artwork — intentionally unlike the star/sparkle and swirl marks
 * other AI products use.
 */
const NODES: [number, number][] = [
  [6.5, 18],
  [6.5, 6],
  [17.5, 18],
  [17.5, 6],
];
const PATH = "M6.5 18V6l11 12V6";

export function NexusOrb({ size = 56, className = "" }: { size?: number; className?: string }) {
  const g = size * 0.54;
  return (
    <span className={`nexus-orb ${className}`} style={{ width: size, height: size }} aria-hidden>
      <span className="nexus-orb__aurora" />
      <svg className="nexus-orb__glyph" width={g} height={g} viewBox="0 0 24 24" fill="none">
        <path className="nexus-orb__line" d={PATH} />
        <path className="nexus-orb__pulse" d={PATH} pathLength={100} />
        {NODES.map(([x, y], i) => (
          <circle key={i} className="nexus-orb__node" cx={x} cy={y} r="2" style={{ animationDelay: `${i * 0.7}s` }} />
        ))}
      </svg>
    </span>
  );
}
