"use client";

import { useMemo, useSyncExternalStore } from "react";

export type ChartTheme = {
  up: string;
  down: string;
  text: string;
  grid: string;
  accent: string;
  surface: string;
};

const FALLBACK: ChartTheme = {
  up: "#30d158",
  down: "#ff453a",
  text: "#8e8e93",
  grid: "rgba(255,255,255,0.06)",
  accent: "#0a84ff",
  surface: "#1c1c1e",
};
const FALLBACK_KEY = JSON.stringify(FALLBACK);

function read(): string {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return JSON.stringify({
    up: v("--pos", FALLBACK.up),
    down: v("--neg", FALLBACK.down),
    text: v("--ink-400", FALLBACK.text),
    grid: v("--grid-line", FALLBACK.grid),
    accent: v("--accent", FALLBACK.accent),
    surface: v("--surface", FALLBACK.surface),
  } satisfies ChartTheme);
}

function subscribe(callback: () => void) {
  // Theme toggles change data-theme / inline style on <html>; "auto" mode
  // follows the OS scheme via a media query.
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "style", "class"] });
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  mq.addEventListener("change", callback);
  return () => {
    observer.disconnect();
    mq.removeEventListener("change", callback);
  };
}

/** Resolved design-token colors for canvas-drawn UI (charts can't use CSS
 * vars directly). Re-renders the caller when the theme changes. */
export function useChartTheme(): ChartTheme {
  const key = useSyncExternalStore(subscribe, read, () => FALLBACK_KEY);
  return useMemo(() => JSON.parse(key) as ChartTheme, [key]);
}

/** "#rrggbb" + alpha -> rgba(); any other color format passes through. */
export function withAlpha(color: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return color;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
