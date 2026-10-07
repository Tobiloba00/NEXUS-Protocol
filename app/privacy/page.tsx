import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What NEXUS Protocol stores, what it shares, and who else sees your data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="We collect as little as we can. This page explains exactly what NEXUS stores, what leaves your browser, and which outside services see what."
      sections={[
        {
          heading: "Stored in your browser",
          body: [
            "NEXUS saves a few preferences in your browser's local storage: your light/dark choice, the fact that you accepted our terms (with the version and time), and, if you use alerts, a random link code and your Telegram chat ID. We don't use advertising or tracking cookies.",
          ],
        },
        {
          heading: "Stored on our servers",
          body: [
            "If you set up Telegram alerts, we store your Telegram chat ID and username (if you share one) and your alert rules so we can send you messages. The questions you type into the AI assistant are processed to produce an answer (see section 4); we don't build profiles from them.",
          ],
        },
        {
          heading: "Services your browser talks to directly",
          body: [
            "To keep prices and listings live, your browser connects directly to some providers, including Binance and Bybit (live prices), DexScreener (new listings) and Polymarket (prediction odds). Like any website you visit, those providers receive your IP address and technical details such as your browser type, and they have their own privacy policies.",
          ],
        },
        {
          heading: "AI assistant",
          body: [
            "Questions you ask the assistant are sent to Google's Gemini API to generate answers. On Google's free tier, submitted content may be reviewed and used to improve Google's products. Don't enter personal, financial-account or other sensitive information.",
          ],
        },
        {
          heading: "Security scans",
          body: [
            "When you run a contract security scan, the token address is sent through our server to GoPlus to retrieve its report. Token addresses are public blockchain data.",
          ],
        },
        {
          heading: "Your choices",
          body: [
            "You can clear NEXUS data any time by clearing this site's storage in your browser. You can stop alerts by deleting your alert rules or blocking the Telegram bot. Ask us to delete the data we hold about you via the contact details on this site, where provided.",
          ],
        },
        {
          heading: "Changes",
          body: [
            "If we add features that collect more (such as accounts or analytics), we'll update this policy first and ask you to accept the new version.",
          ],
        },
      ]}
    />
  );
}
