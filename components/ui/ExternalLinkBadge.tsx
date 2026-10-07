/**
 * The small, secondary "go to the source" affordance — deliberately NOT
 * wrapping a whole row/card in a link. Making the entire item a redirect
 * makes the site read as a directory of outbound links rather than a product
 * that shows real data on its own pages. Full data stays on our page; this is
 * just attribution + an escape hatch, styled as a quiet text link.
 */
export function ExternalLinkBadge({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="press -my-2 inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap py-2 text-[13.5px] font-medium tracking-[-0.005em] text-accent hover:opacity-80"
    >
      {label}
      <span aria-hidden className="text-[11px]">↗</span>
    </a>
  );
}
