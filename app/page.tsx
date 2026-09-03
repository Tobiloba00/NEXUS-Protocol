import type { Metadata } from "next";
import Link from "next/link";
import { FEATURE_FLAGS } from "@/lib/config/project-config";

export const metadata: Metadata = {
  description:
    "Live crypto prices & charts, new coin listings, NFT floors, and prediction-market odds — one dashboard, free, real-time.",
};

// Only "showPrices" has a real page behind it right now (Days 5-6). The
// rest are built next (Days 7-8) — shown as not-yet-live rather than as
// dead links pretending to work, matching the tri-state status pattern's
// spirit: never claim more than what's actually there.
const LIVE_ROUTES: Partial<Record<(typeof FEATURE_FLAGS)[number]["key"], string>> = {
  showPrices: "/markets",
  showListings: "/new-listings",
  showNFTs: "/nft",
  showPredictions: "/predictions",
};

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-20">
      <div className="w-full max-w-3xl">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">NEXUS Protocol</h1>
        <p className="mb-10 max-w-xl text-ink-300">
          One dashboard for live crypto prices, new listings, NFT floors, and prediction-market
          odds — all real data. Telegram alerts land next.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {FEATURE_FLAGS.map((f) => {
            const href = LIVE_ROUTES[f.key];
            const card = (
              <div
                className={`rounded-xl2 border border-line bg-surface p-4 shadow-[var(--shadow-card)] ${
                  href ? "hover:border-line-2 hover:bg-hover" : "opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink-50">{f.label}</span>
                  {!href && (
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-ink-400">
                      Coming soon
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm text-ink-400">{f.desc}</div>
              </div>
            );
            return (
              <li key={f.key}>
                {href ? (
                  <Link href={href} className="block">
                    {card}
                  </Link>
                ) : (
                  card
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
