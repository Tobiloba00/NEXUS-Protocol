/**
 * Branding/config system, ported from legacy/index.html:564-624.
 *
 * The legacy app mutated a single global `const PROJECT_CONFIG` in place and
 * re-read it from ~40 call sites. That doesn't work in Next.js (no shared
 * mutable global across server/client, and it breaks SSR determinism), so
 * this becomes a typed default + a React Context (see
 * components/config/AppConfigProvider.tsx) that holds the live value.
 * Server-rendered output always uses DEFAULT_CONFIG so crawlers see a
 * deterministic brand; a visitor's admin-panel edits are a client-side
 * localStorage override layered on top after hydration, exactly like the
 * legacy theme system avoids FOUC.
 */

export type ProjectConfig = {
  name: string;
  shortName: string;
  ticker: string;
  network: string;
  brand: {
    primary: string;
    secondary: string;
    logo: string;
  };
  features: Record<FeatureKey, boolean>;
  social: Record<SocialKey, string>;
};

export type FeatureKey =
  | "showPrices"
  | "showListings"
  | "showNFTs"
  | "showPredictions"
  | "showAlerts";

export type SocialKey = "twitter" | "discord" | "telegram" | "github";

// Ported from legacy/index.html:581-589. Trimmed to the four confirmed
// product modules (see plan's "keep or drop legacy sections" decision) —
// Swap/Gaming/Portfolio/Premium are dropped, not ported.
export const FEATURE_FLAGS: {
  key: FeatureKey;
  label: string;
  desc: string;
  route: string;
}[] = [
  { key: "showPrices", label: "Live Prices", desc: "Real-time price tickers & charts", route: "/markets" },
  { key: "showListings", label: "New Listings", desc: "Freshly listed coins & DEX pairs", route: "/new-listings" },
  { key: "showNFTs", label: "NFT Marketplace", desc: "Floor prices across marketplaces", route: "/nft" },
  { key: "showPredictions", label: "Prediction Markets", desc: "Read-only odds from Polymarket", route: "/predictions" },
  { key: "showAlerts", label: "Telegram Alerts", desc: "Price & event notifications", route: "/alerts" },
];

// Ported from legacy/index.html:593-599, minus fields (medium) that had no
// real use in the new nav.
export const SOCIAL_FIELDS: { key: SocialKey; label: string; placeholder: string }[] = [
  { key: "twitter", label: "X / Twitter", placeholder: "https://x.com/yourhandle" },
  { key: "discord", label: "Discord", placeholder: "https://discord.gg/yourinvite" },
  { key: "telegram", label: "Telegram", placeholder: "https://t.me/yourbot" },
  { key: "github", label: "GitHub", placeholder: "https://github.com/yourorg" },
];

export const DEFAULT_CONFIG: ProjectConfig = {
  name: "NEXUS Protocol",
  shortName: "nexus",
  ticker: "NEX",
  network: "Multi-chain",
  brand: {
    primary: "#8b5cf6",
    secondary: "#22d3ee",
    logo: "",
  },
  features: {
    showPrices: true,
    showListings: true,
    showNFTs: true,
    showPredictions: true,
    showAlerts: true,
  },
  social: {
    twitter: "",
    discord: "",
    telegram: "",
    github: "",
  },
};

// Ported from legacy/index.html:605-624 — presets carry only brand identity
// (name/ticker/network/colors), never features/social, so swapping a preset
// never wipes a visitor's feature toggles or social links.
export const CONFIG_PRESETS: Record<
  string,
  Pick<ProjectConfig, "name" | "shortName" | "ticker" | "network" | "brand">
> = {
  nexus: {
    name: "NEXUS Protocol",
    shortName: "nexus",
    ticker: "NEX",
    network: "Multi-chain",
    brand: { primary: "#8b5cf6", secondary: "#22d3ee", logo: "" },
  },
  chronos: {
    name: "Chronos",
    shortName: "chronos",
    ticker: "CHR",
    network: "Multi-chain",
    brand: { primary: "#ec4899", secondary: "#8b5cf6", logo: "⏳" },
  },
  vertex: {
    name: "Vertex",
    shortName: "vertex",
    ticker: "VTX",
    network: "Multi-chain",
    brand: { primary: "#22c55e", secondary: "#22d3ee", logo: "📈" },
  },
};

export const CONFIG_STORAGE_KEY = "nexus-config";
export const THEME_STORAGE_KEY = "nexus-theme";

/** CSS var writes ported from applyBrandColors (legacy/index.html:642-656). */
export function applyBrandColors(brand: ProjectConfig["brand"]) {
  const root = document.documentElement;
  root.style.setProperty("--accent", brand.primary);
  root.style.setProperty("--accent-2", brand.secondary);
}
