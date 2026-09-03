import type { Metadata } from "next";
import { fetchActiveMarkets } from "@/lib/data-sources/polymarket";
import { PredictionsList } from "@/components/predictions/PredictionsList";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Prediction Markets",
  description:
    "Read-only odds from Polymarket prediction markets — informational only, not a betting service.",
};

export default async function PredictionsPage() {
  const markets = await fetchActiveMarkets(40);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-xl font-semibold">Prediction Markets</h1>
        <p className="mt-1 text-sm text-ink-400">
          Real-time odds from Polymarket. Informational only — we don&apos;t facilitate wagering; the
          badge on each market links out if you want to trade.
        </p>
      </div>
      <PredictionsList markets={markets} />
    </main>
  );
}
