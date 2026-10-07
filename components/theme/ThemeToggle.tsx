"use client";

import { Sun, Moon, SunMoon } from "lucide-react";
import { useTheme } from "./useTheme";

/** Icon-only: auto -> light -> dark. The icon shows the current preference. */
export function ThemeToggle() {
  const { pref, cycle } = useTheme();
  const Icon = pref === "light" ? Sun : pref === "dark" ? Moon : SunMoon;
  const label = pref === "light" ? "Light" : pref === "dark" ? "Dark" : "Auto";

  return (
    <button
      onClick={cycle}
      className="press flex h-11 w-11 items-center justify-center rounded-full lg:h-9 lg:w-9 text-ink-300 transition-colors hover:bg-hover hover:text-ink-50"
      title={`Theme: ${label} (click to change)`}
      aria-label={`Theme: ${label}. Click to change.`}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
    </button>
  );
}
