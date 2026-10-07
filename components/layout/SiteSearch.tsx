"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { LAUNCH_PAIRS } from "@/lib/exchanges/pairs";

const STATIC_PAGES = [
  { label: "Home", href: "/" },
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

/** Filters every page + trading pair client-side and navigates on select.
 * "/" or ⌘/Ctrl+K focuses it from anywhere. */
export function SiteSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return SEARCHABLE.filter((item) => item.label.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      const typing = /input|textarea|select/i.test((e.target as HTMLElement)?.tagName ?? "");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function go(href: string) {
    router.push(href);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-ink-400"
        strokeWidth={2}
      />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) go(results[0].href);
        }}
        placeholder="Search"
        aria-label="Search"
        className="h-9 w-full rounded-[11px] bg-[var(--seg-track)] pl-[34px] pr-3 text-[15px] tracking-[-0.01em] outline-none transition-shadow placeholder:text-ink-400 focus:ring-2 focus:ring-accent/40"
      />
      {open && results.length > 0 && (
        <ul className="absolute right-0 z-50 mt-2 w-full min-w-[220px] overflow-hidden rounded-2xl bg-surface p-1.5 shadow-[var(--shadow-lg)]">
          {results.map((r) => (
            <li key={r.href}>
              <button
                onClick={() => go(r.href)}
                className="block w-full rounded-xl px-3 py-2 text-left text-[15px] transition-colors hover:bg-hover"
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
