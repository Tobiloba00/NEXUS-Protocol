import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppConfigProvider } from "@/components/config/AppConfigProvider";
import { TopNav } from "@/components/layout/TopNav";
import { MobileTabBar } from "@/components/layout/MobileNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TermsGate } from "@/components/legal/TermsGate";
import { AskLauncher } from "@/components/ask/AskLauncher";
import { TERMS_STORAGE_KEY, TERMS_VERSION } from "@/lib/legal/terms";
import { CONFIG_STORAGE_KEY, THEME_STORAGE_KEY } from "@/lib/config/project-config";

// Inter is only the fallback: Apple devices use their own SF Pro via
// -apple-system (see --font-sans in globals.css).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// viewportFit "cover" is what makes env(safe-area-inset-*) report real values
// on notched iPhones — without it the tab bar and sheets sit under the home
// indicator. "resizes-content" makes Android shrink the layout (not overlay it)
// when the keyboard opens, so bottom-pinned inputs stay visible.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export const metadata: Metadata = {
  applicationName: "NEXUS",
  appleWebApp: { capable: true, title: "NEXUS", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
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
  // Agreement gate: show it (via CSS on this attribute) until the visitor has
  // accepted the CURRENT terms version. Set before first paint — no flash.
  try {
    var t = JSON.parse(localStorage.getItem(${JSON.stringify(TERMS_STORAGE_KEY)}) || "null");
    if (!t || t.v !== ${JSON.stringify(TERMS_VERSION)}) document.documentElement.setAttribute("data-terms", "needed");
  } catch (e) {
    document.documentElement.setAttribute("data-terms", "needed");
  }
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
      // The default brand colors are the theme's own accent (globals.css),
      // so only a non-default saved color becomes an inline override.
      if (brand && hex.test(brand.primary) && brand.primary.toLowerCase() !== "#0a84ff") {
        document.documentElement.style.setProperty("--accent", brand.primary);
      }
      if (brand && hex.test(brand.secondary) && brand.secondary.toLowerCase() !== "#5ac8fa") {
        document.documentElement.style.setProperty("--accent-2", brand.secondary);
      }
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Open connections to the image hosts early so icons start downloading sooner. */}
        <link rel="preconnect" href="https://coin-images.coingecko.com" crossOrigin="" />
        <link rel="preconnect" href="https://assets.coingecko.com" crossOrigin="" />
        <link rel="preconnect" href="https://cdn.dexscreener.com" crossOrigin="" />
        <link rel="preconnect" href="https://img-cdn.magiceden.dev" crossOrigin="" />
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className="min-h-full bg-bg font-sans text-ink-50">
        <AppConfigProvider>
          <TopNav />
          <div>{children}</div>
          <SiteFooter />
          <div className="h-[calc(96px+env(safe-area-inset-bottom))] lg:hidden" aria-hidden />
          <MobileTabBar />
          <AskLauncher />
          <TermsGate />
        </AppConfigProvider>
      </body>
    </html>
  );
}
