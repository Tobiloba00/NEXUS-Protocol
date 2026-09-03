import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, TrendingUp, ChartCandlestick, Sparkles, Image, Vote, Bell } from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon };
export type NavGroup = { label: string | null; items: NavItem[] };

/** Single source of truth for the sidebar and mobile bottom nav, so they
 * can't drift out of sync with each other. */
export const NAV_GROUPS: NavGroup[] = [
  { label: null, items: [{ label: "Overview", href: "/", icon: LayoutDashboard }] },
  {
    label: "Markets",
    items: [
      { label: "Markets", href: "/markets", icon: TrendingUp },
      { label: "Trade", href: "/trade/btc-usdt", icon: ChartCandlestick },
    ],
  },
  {
    label: "Discover",
    items: [
      { label: "New Listings", href: "/new-listings", icon: Sparkles },
      { label: "NFTs", href: "/nft", icon: Image },
      { label: "Predictions", href: "/predictions", icon: Vote },
    ],
  },
  { label: "Tools", items: [{ label: "Alerts", href: "/alerts", icon: Bell }] },
];

/** Flat list, for the mobile bottom tab bar (fewer slots, so it's a curated
 * subset rather than every group). */
export const MOBILE_TABS: NavItem[] = [
  NAV_GROUPS[0].items[0],
  NAV_GROUPS[1].items[0],
  NAV_GROUPS[1].items[1],
  NAV_GROUPS[3].items[0],
];
