import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms that apply when you use NEXUS Protocol.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      intro="By using NEXUS Protocol (“NEXUS”, “the site”) you agree to these terms. If you don't agree, please don't use the site."
      sections={[
        {
          heading: "What NEXUS is",
          body: [
            "NEXUS is an information service. It collects and displays cryptocurrency prices, new token listings, NFT data, prediction-market odds, news headlines, automated risk ratings and AI-written summaries from third-party sources.",
            "NEXUS is not a broker, exchange, wallet, custodian, investment adviser or financial institution. We never hold your funds, and we cannot buy, sell or trade for you. When a link takes you to another service to buy or trade something, that transaction is entirely between you and that service.",
          ],
        },
        {
          heading: "No advice",
          body: [
            "Nothing on NEXUS is financial, investment, legal, accounting or tax advice, or a recommendation or solicitation to buy, sell or hold any asset. This includes prices, charts, rankings, risk ratings, crowd odds, news, third-party opinions and anything written by AI.",
            "You are solely responsible for your decisions. Speak to a qualified professional before making financial choices.",
          ],
        },
        {
          heading: "Eligibility",
          body: [
            "You must be at least 18 years old and legally able to enter into these terms. You are responsible for making sure that accessing and using this information is lawful where you live. Do not use NEXUS where it is prohibited.",
          ],
        },
        {
          heading: "Accuracy and availability",
          body: [
            "Data comes from third parties and may be delayed, incomplete, inaccurate or unavailable. Risk ratings are an automated heuristic that flags common warning signs; they cannot tell you whether a token is safe or a scam. AI answers and summaries can contain mistakes. Prediction-market odds reflect traders' opinions, not facts or forecasts.",
            "We provide the site “as is” and “as available”, without warranties of any kind, and we may change, suspend or remove features at any time.",
          ],
        },
        {
          heading: "Third-party content and links",
          body: [
            "News headlines, opinions and posts from outside voices belong to their publishers and authors. Including them does not mean we endorse them or have verified them. Links to third-party sites are provided for convenience; we are not responsible for their content, products, security or practices.",
          ],
        },
        {
          heading: "Acceptable use",
          body: [
            "Don't misuse the site: no attempts to disrupt or overload it, scrape it at scale, bypass rate limits or security measures, or use it to break the law. Don't submit personal, confidential or sensitive information to the AI assistant.",
          ],
        },
        {
          heading: "Limitation of liability",
          body: [
            "To the fullest extent the law allows, NEXUS and its operators are not liable for any loss or damage — including trading losses, lost profits or lost data — arising from your use of, or inability to use, the site or from relying on anything on it. Nothing in these terms limits liability that cannot lawfully be limited.",
          ],
        },
        {
          heading: "Changes",
          body: [
            "We may update these terms. When we make a material change, we'll update the version date and ask you to accept again. Continuing to use the site after that means you accept the new terms.",
          ],
        },
      ]}
    />
  );
}
