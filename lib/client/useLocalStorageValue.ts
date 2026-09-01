"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Reads/writes a single localStorage key via useSyncExternalStore instead of
 * "read in a mount effect, then setState" — the latter trips the
 * react-hooks/set-state-in-effect lint rule (setState directly in an effect
 * body causes an extra render pass) and useSyncExternalStore is the API
 * React actually provides for syncing to an external, possibly
 * cross-tab-mutated store like localStorage. getServerSnapshot returns null
 * so SSR and the first client render agree (no hydration mismatch); the
 * real value swaps in on the very next paint once this hook subscribes.
 */

const listeners = new Map<string, Set<() => void>>();

function notify(key: string) {
  listeners.get(key)?.forEach((cb) => cb());
}

function subscribe(key: string) {
  return (callback: () => void) => {
    let set = listeners.get(key);
    if (!set) {
      set = new Set();
      listeners.set(key, set);
    }
    set.add(callback);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) callback();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      set!.delete(callback);
      window.removeEventListener("storage", onStorage);
    };
  };
}

function getServerSnapshot() {
  return null;
}

export function useLocalStorageValue(key: string) {
  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key]);

  const value = useSyncExternalStore(subscribe(key), getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: string) => {
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // localStorage unavailable (private mode, quota) — state won't persist, but doesn't throw.
      }
      notify(key);
    },
    [key]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    notify(key);
  }, [key]);

  return [value, setValue, removeValue] as const;
}
