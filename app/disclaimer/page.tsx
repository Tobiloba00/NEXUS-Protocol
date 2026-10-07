import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Risk Disclaimer",
  description: "Crypto is risky. What NEXUS's data, ratings, news and AI summaries can and cannot tell you.",
};

export default function DisclaimerPage() {
  return (
    <LegalPage
      title="Risk Disclaimer"
      intro="Please read this before you rely on anything on NEXUS. It is information, not advice."
      sections={[
        {
          heading: "Crypto assets are high risk",
          body: [
            "Cryptocurrencies, tokens and NFTs are highly volatile and can lose most or all of their value quickly. They are largely unregulated, may be illiquid, and can be affected by hacks, scams, technical failures and sudden rule changes. You can lose everything you put in. Only use money you can afford to lose.",
          ],
        },
        {
          heading: "New tokens are especially dangerous",
          body: [
            "Newly listed tokens are frequently scams (“rug pulls”, honeypots that stop you selling, tokens whose creators can mint unlimited supply). Our risk rating and contract scan look for common warning signs only. A “lower risk” rating does not mean a token is safe, and a missing warning does not mean there is no problem.",
          ],
        },
        {
          heading: "Ratings, odds and AI summaries",
          body: [
            "Everything produced by AI on NEXUS (answers, insights, briefs and summaries) is information only. It is not financial, investment, legal or tax advice. NEXUS and its operators accept no liability for any loss or damage, direct or indirect, that results from using or relying on it.",
            "Risk ratings are produced by an automated formula from public trading data. Prediction-market odds show what traders are currently paying, not what will happen. Summaries, briefs and answers written by AI are generated automatically from the data shown, can be wrong or out of date, and are not reviewed by a person before you see them.",
          ],
        },
        {
          heading: "News and outside voices",
          body: [
            "Headlines, articles, videos and opinions from other publishers and public figures are shown for information. We don't verify them, they may be biased or mistaken, and people discussing assets may hold those assets or be paid to promote them. Insider stories and rumours are not facts.",
          ],
        },
        {
          heading: "Data may be late or wrong",
          body: [
            "Prices and other figures come from third-party sources and may be delayed, incomplete or inaccurate. Always check the original source and the live price on your exchange before acting.",
          ],
        },
        {
          heading: "Buying and trading",
          body: [
            "NEXUS does not sell, buy or hold anything for you. Links to marketplaces and exchanges lead to independent services with their own terms, fees and risks. Make sure you understand them, and that using them is legal where you live, before you transact.",
          ],
        },
        {
          heading: "Your responsibility",
          body: [
            "You make your own decisions. Consider speaking to a licensed financial, tax or legal professional about your situation. Past performance does not predict future results.",
          ],
        },
      ]}
    />
  );
}
