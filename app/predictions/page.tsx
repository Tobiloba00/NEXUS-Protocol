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
    <Page narrow>
      <PageHeader
        title="Predictions"
        subtitle="Live odds from Polymarket. Informational only — we don't take bets; each market links out if you want to trade."
      />
      <PredictionsList markets={markets} />
    </Page>
  );
}
