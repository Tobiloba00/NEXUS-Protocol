import { thumb } from "@/lib/ui/thumb";

/** Real icon when the source gave us one; otherwise a monogram fallback —
 * never a broken-image icon or an empty gap where a logo should be.
 *
 * Default: a fixed-size round icon (`size`). Pass `className` to size it
 * yourself (e.g. a full-width square NFT image) and `rounded={false}` for
 * square corners; `size` is ignored in that mode. */
export function TokenIcon({
  src,
  alt,
  size = 36,
  className,
  rounded = true,
}: {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
  rounded?: boolean;
}) {
  const shape = rounded ? "rounded-full" : "";
  const sizing = className ? undefined : { width: size, height: size };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- sources span many CDNs, not worth a remotePatterns allowlist for a v1 list page
      <img
        alt=""
        src={className ? src : thumb(src, size)}
        loading="lazy"
        decoding="async"
        width={className ? undefined : size}
        height={className ? undefined : size}
        className={`${className ? "" : "shrink-0"} ${shape} bg-surface-2 object-cover ${className ?? ""}`}
        style={sizing}
      />
    );
  }
  return (
    <div
      className={`flex ${className ? "" : "shrink-0"} items-center justify-center ${shape} bg-surface-2 text-xs font-semibold text-ink-300 ${className ?? ""}`}
      style={sizing}
      aria-hidden
    >
      {alt.slice(0, 2).toUpperCase()}
    </div>
  );
}
