/** Real icon when the source gave us one; otherwise a monogram fallback —
 * never a broken-image icon or an empty gap where a logo should be. */
export function TokenIcon({
  src,
  alt,
  size = 36,
}: {
  src?: string | null;
  alt: string;
  size?: number;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- sources span many CDNs, not worth a remotePatterns allowlist for a v1 list page
      <img
        src={src}
        alt=""
        className="shrink-0 rounded-full bg-surface-2 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-ink-300"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {alt.slice(0, 2).toUpperCase()}
    </div>
  );
}
