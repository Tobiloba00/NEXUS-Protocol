/**
 * The AI assistant's mark: a glass sphere with a slowly drifting aurora inside
 * and a four-point sparkle on top. Pure CSS (see .nexus-orb in globals.css),
 * so it costs no JavaScript and no image, and it honours reduced-motion.
 */
export function NexusOrb({ size = 56, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`nexus-orb ${className}`} style={{ width: size, height: size }} aria-hidden>
      <span className="nexus-orb__aurora" />
      <svg className="nexus-orb__spark" width={size * 0.44} height={size * 0.44} viewBox="0 0 24 24" fill="#fff">
        <path d="M12 1.5c.9 6.1 4.4 9.6 10.5 10.5-6.1.9-9.6 4.4-10.5 10.5C11.1 16.4 7.6 12.9 1.5 12 7.6 11.1 11.1 7.6 12 1.5Z" />
      </svg>
    </span>
  );
}
