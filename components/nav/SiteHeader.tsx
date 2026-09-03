import Link from "next/link";

/** Minimal shared header so pages are actually navigable (home <-> markets
 * <-> individual trade pages) instead of each page being a dead end -
 * the gap that made the first deploy look static/non-interactive. */
export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-3xl items-center gap-6 px-6 py-4">
        <Link href="/" className="font-semibold">
          NEXUS Protocol
        </Link>
        <nav className="flex gap-4 text-sm text-ink-300">
          <Link href="/markets" className="hover:text-ink-50">
            Markets
          </Link>
          <Link href="/new-listings" className="hover:text-ink-50">
            New Listings
          </Link>
          <Link href="/nft" className="hover:text-ink-50">
            NFTs
          </Link>
          <Link href="/predictions" className="hover:text-ink-50">
            Predictions
          </Link>
        </nav>
      </div>
    </header>
  );
}
