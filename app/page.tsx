import type { Metadata } from "next";
import { FEATURE_FLAGS } from "@/lib/config/project-config";
import { LiveStatusChip } from "@/components/status/LiveStatusChip";

export const metadata: Metadata = {
  description:
    "Live crypto prices & charts, new coin listings, NFT floor prices, and prediction-market odds — one dashboard, free, real-time.",
};

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-20">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">NEXUS Protocol</h1>
          <LiveStatusChip status="mock" />
        </div>
        <p className="mb-10 max-w-xl text-ink-300">
          One dashboard for live crypto prices, new listings, NFT floors, and prediction-market
          odds. This is the infra skeleton — data modules land next.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {FEATURE_FLAGS.map((f) => (
            <li
              key={f.key}
              className="rounded-xl2 border border-line bg-surface p-4 shadow-[var(--shadow-card)]"
            >
              <div className="font-medium text-ink-50">{f.label}</div>
              <div className="mt-1 text-sm text-ink-400">{f.desc}</div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
