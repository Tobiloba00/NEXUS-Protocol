/**
 * The small, secondary "go to the source" affordance — deliberately NOT
 * wrapping a whole row/card in a link. Direct feedback: making the entire
 * item a redirect made the site read as a directory of outbound links
 * rather than a product that displays real data on its own pages. Full
 * data stays on our page; this is just attribution + an escape hatch.
 */
export function ExternalLinkBadge({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[11px] text-ink-400 transition-colors hover:border-line-2 hover:text-ink-100"
    >
      {label} ↗
    </a>
  );
}
