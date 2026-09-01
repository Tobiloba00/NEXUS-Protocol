"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import {
  applyBrandColors,
  CONFIG_STORAGE_KEY,
  DEFAULT_CONFIG,
  type ProjectConfig,
} from "@/lib/config/project-config";
import { useLocalStorageValue } from "@/lib/client/useLocalStorageValue";

/**
 * Config context ported from legacy/index.html's AppProvider config slice
 * (1485-1518). Server-rendered pages never see this — they render
 * DEFAULT_CONFIG directly for deterministic SSR/SEO output. This provider
 * only takes over post-hydration, reading any saved localStorage override
 * (a visitor's own admin-panel edits) via useSyncExternalStore (see
 * useLocalStorageValue) rather than an effect + setState, and re-applying
 * brand CSS vars — the DOM-mutation half of the same trick the pre-
 * hydration <script> in app/layout.tsx uses to avoid a flash on reload.
 */

type AppConfigContextValue = {
  config: ProjectConfig;
  setConfig: (next: ProjectConfig) => void;
  resetConfig: () => void;
};

const AppConfigContext = createContext<AppConfigContextValue | null>(null);

function mergeOntoDefaults(parsed: Partial<ProjectConfig> | null): ProjectConfig {
  if (!parsed) return DEFAULT_CONFIG;
  // Deep-merge onto defaults so an older saved config missing a newer key
  // (e.g. a feature flag added later) doesn't crash — mirrors legacy
  // index.html:1485-1504.
  return {
    ...DEFAULT_CONFIG,
    ...parsed,
    brand: { ...DEFAULT_CONFIG.brand, ...parsed.brand },
    features: { ...DEFAULT_CONFIG.features, ...parsed.features },
    social: { ...DEFAULT_CONFIG.social, ...parsed.social },
  };
}

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const [raw, setRaw, removeRaw] = useLocalStorageValue(CONFIG_STORAGE_KEY);

  const config = useMemo(() => {
    if (!raw) return DEFAULT_CONFIG;
    try {
      return mergeOntoDefaults(JSON.parse(raw));
    } catch {
      return DEFAULT_CONFIG;
    }
  }, [raw]);

  // DOM mutation only (CSS custom properties), not setState — safe in an effect.
  useEffect(() => {
    applyBrandColors(config.brand);
  }, [config.brand]);

  const value = useMemo<AppConfigContextValue>(
    () => ({
      config,
      setConfig: (next) => setRaw(JSON.stringify(next)),
      resetConfig: () => removeRaw(),
    }),
    [config, setRaw, removeRaw]
  );

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig() {
  const ctx = useContext(AppConfigContext);
  if (!ctx) throw new Error("useAppConfig must be used within AppConfigProvider");
  return ctx;
}
