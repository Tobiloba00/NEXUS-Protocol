"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/lib/config/project-config";
import { useLocalStorageValue } from "@/lib/client/useLocalStorageValue";

export type ThemePref = "auto" | "light" | "dark";

function subscribeToColorScheme(callback: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
function getSystemIsLight() {
  return window.matchMedia("(prefers-color-scheme: light)").matches;
}
function getServerSystemIsLight() {
  return false; // server-rendered default matches app/globals.css's dark default
}

/**
 * Ported from legacy/index.html:1867-1897. "auto" removes [data-theme]
 * entirely so the CSS @media(prefers-color-scheme) block in globals.css
 * takes over; light/dark set the attribute explicitly, winning over system
 * preference. System-preference tracking uses useSyncExternalStore (not an
 * effect + setState) so a live OS theme change is picked up without an
 * extra render pass.
 */
export function useTheme() {
  const [storedPref, setStoredPref] = useLocalStorageValue(THEME_STORAGE_KEY);
  const pref: ThemePref = (storedPref as ThemePref | null) ?? "auto";

  const systemIsLight = useSyncExternalStore(
    subscribeToColorScheme,
    getSystemIsLight,
    getServerSystemIsLight
  );
  const resolved: "light" | "dark" = pref === "auto" ? (systemIsLight ? "light" : "dark") : pref;

  // DOM mutation only — no setState here, so this doesn't trigger an extra render.
  useEffect(() => {
    const root = document.documentElement;
    if (pref === "auto") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", pref);
    }
  }, [pref]);

  const cycle = useCallback(() => {
    const next: ThemePref = pref === "auto" ? "light" : pref === "light" ? "dark" : "auto";
    setStoredPref(next);
  }, [pref, setStoredPref]);

  return { pref, resolved, cycle };
}
