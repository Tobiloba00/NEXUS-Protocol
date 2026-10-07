import type { LucideIcon } from "lucide-react";
import { House, ChartNoAxesCombined, Sparkles, Image, Vote, Bell, Newspaper } from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon };

/** Single source of truth for the top nav and the mobile tab bar. The AI
 * assistant is not a nav item: it lives in the floating button (and /ask). */
export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: House },
  { label: "Markets", href: "/markets", icon: ChartNoAxesCombined },
  { label: "New Coins", href: "/new-listings", icon: Sparkles },
  { label: "NFTs", href: "/nft", icon: Image },
  { label: "Predictions", href: "/predictions", icon: Vote },
  { label: "News", href: "/news", icon: Newspaper },
  { label: "Alerts", href: "/alerts", icon: Bell },
];

/** Five slots, like an iOS tab bar. News, Alerts and Ask live in the mobile top bar. */
export const MOBILE_TABS: NavItem[] = NAV_ITEMS.slice(0, 5);

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  // /trade/* belongs to Markets
  if (href === "/markets") return pathname === "/markets" || pathname.startsWith("/trade/");
  return pathname === href || pathname.startsWith(href + "/");
}
