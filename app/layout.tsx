import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppConfigProvider } from "@/components/config/AppConfigProvider";
import { CONFIG_STORAGE_KEY, THEME_STORAGE_KEY } from "@/lib/config/project-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "NEXUS Protocol — Live Crypto Prices, Listings, NFTs & Predictions",
    template: "%s | NEXUS Protocol",
  },
  description:
    "One dashboard for live crypto prices & charts, new coin listings, NFT floor prices, and prediction-market odds — free, real-time, no signup.",
};

// Pre-hydration script, ported from legacy/index.html:38-83. Runs before React
// attaches, touches only documentElement attributes/inline styles (never
// content React controls), so it cannot cause a hydration mismatch. This is
// what gives both the theme AND a visitor's saved brand colors zero flash-of-
// wrong-look on reload, without needing SSR to know the visitor's localStorage.
const noFlashScript = `
(function () {
  try {
    var theme = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  } catch (e) {}
  try {
    var raw = localStorage.getItem(${JSON.stringify(CONFIG_STORAGE_KEY)});
    if (raw) {
      var cfg = JSON.parse(raw);
      var brand = cfg && cfg.brand;
      var hex = /^#[0-9a-fA-F]{6}$/;
      if (brand && hex.test(brand.primary)) {
        document.documentElement.style.setProperty("--accent", brand.primary);
      }
      if (brand && hex.test(brand.secondary)) {
        document.documentElement.style.setProperty("--accent-2", brand.secondary);
      }
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-ink-50">
        <AppConfigProvider>{children}</AppConfigProvider>
      </body>
    </html>
  );
}
