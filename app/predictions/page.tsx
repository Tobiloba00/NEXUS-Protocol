import type { Metadata } from "next";
import { getPredictionMarkets } from "@/lib/data/cache";
import { Page, PageHeader } from "@/components/layout/Page";
import { PredictionsList } from "@/components/predictions/PredictionsList";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Prediction Markets",
  description:
    "Read-only odds from Polymarket prediction markets — informational only, not a betting service.",
};

export default async function PredictionsPage() {
  const { data: markets } = await getPredictionMarkets(40);

  return (
    <Page
      aside={
        <>
          <section className="group-card flex flex-col gap-2 p-5">
            <h2 className="t-headline">How to read the odds</h2>
            <p className="text-[14px] leading-relaxed text-ink-300">
              Each percentage is what traders are currently paying for a &ldquo;Yes&rdquo; share, in cents on the
              dollar. 30% means the market gives it roughly a 3-in-10 chance. Odds move as people trade — they are
              a snapshot of opinion, not a forecast.
            </p>
          </section>
          <section className="group-card flex flex-col gap-2 p-5">
            <h2 className="t-headline">Information only</h2>
            <p className="text-[14px] leading-relaxed text-ink-300">
              NEXUS shows Polymarket&apos;s public data. We don&apos;t take bets or hold funds, and nothing here is
              financial advice. Each market links out to Polymarket if you want to trade there.
            </p>
          </section>
        </>
      }
    >
      <PageHeader title="Predictions" subtitle="Live odds on politics, crypto and world events, from Polymarket." />
      <PredictionsList markets={markets} />
    </Page>
  );
}
