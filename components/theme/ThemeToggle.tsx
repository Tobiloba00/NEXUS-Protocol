"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./useTheme";

/** Finally exposes the theme system that's existed in code since the
 * infra-skeleton commit but had no visible control anywhere on the site. */
export function ThemeToggle() {
  const { pref, cycle } = useTheme();
  const Icon = pref === "light" ? Sun : pref === "dark" ? Moon : Monitor;
  const label = pref === "light" ? "Light" : pref === "dark" ? "Dark" : "Auto";

  return (
    <button
      onClick={cycle}
      className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink-300 hover:bg-hover"
      title={`Theme: ${label} (click to change)`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
