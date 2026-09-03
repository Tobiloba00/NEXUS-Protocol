"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { LAUNCH_PAIRS } from "@/lib/exchanges/pairs";

const STATIC_PAGES = [
  { label: "Overview", href: "/" },
  { label: "Markets", href: "/markets" },
  { label: "New Listings", href: "/new-listings" },
  { label: "NFTs", href: "/nft" },
  { label: "Predictions", href: "/predictions" },
  { label: "Alerts", href: "/alerts" },
];

const SEARCHABLE = [
  ...STATIC_PAGES,
  ...LAUNCH_PAIRS.map((p) => ({ label: `${p.base}/${p.quote}`, href: `/trade/${p.slug}` })),
];

/** Real, if simple: filters a fixed local list (every page + trading pair)
 * client-side and navigates on select — not a decorative input that does
 * nothing, which was the pattern being explicitly moved away from. */
export function SiteSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return SEARCHABLE.filter((item) => item.label.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function go(href: string) {
    router.push(href);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) go(results[0].href);
        }}
        placeholder="Search tokens, pairs, pages…"
        className="w-full rounded-lg border border-line bg-surface-2 py-2 pl-9 pr-3 text-sm placeholder:text-ink-500 focus:outline-none focus:ring-1 focus:ring-accent"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--shadow-lg)]">
          {results.map((r) => (
            <li key={r.href}>
              <button onClick={() => go(r.href)} className="block w-full px-3 py-2 text-left text-sm hover:bg-hover">
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
