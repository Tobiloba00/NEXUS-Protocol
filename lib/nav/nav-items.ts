import type { LucideIcon } from "lucide-react";
import { House, ChartNoAxesCombined, Rocket, Image, Vote, Bell, Newspaper } from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon };

const HOME: NavItem = { label: "Home", href: "/", icon: House };
const MARKETS: NavItem = { label: "Markets", href: "/markets", icon: ChartNoAxesCombined };
const NEW_COINS: NavItem = { label: "New Coins", href: "/new-listings", icon: Rocket };
const NFTS: NavItem = { label: "NFTs", href: "/nft", icon: Image };
const PREDICTIONS: NavItem = { label: "Predictions", href: "/predictions", icon: Vote };
const NEWS: NavItem = { label: "News", href: "/news", icon: Newspaper };
const ALERTS: NavItem = { label: "Alerts", href: "/alerts", icon: Bell };

/** Desktop top nav. The AI assistant is not a link: it's the orb. */
export const NAV_ITEMS: NavItem[] = [HOME, MARKETS, NEW_COINS, NFTS, PREDICTIONS, NEWS, ALERTS];

/** Phone/tablet dock: two tabs, the AI orb in the middle, two tabs. */
export const DOCK_LEFT: NavItem[] = [HOME, MARKETS];
export const DOCK_RIGHT: NavItem[] = [NEW_COINS, NFTS];

/** The rest of the destinations live in the phone/tablet top bar. */
export const TOPBAR_LINKS: NavItem[] = [PREDICTIONS, NEWS, ALERTS];

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  // /trade/* belongs to Markets
  if (href === "/markets") return pathname === "/markets" || pathname.startsWith("/trade/");
  return pathname === href || pathname.startsWith(href + "/");
}
