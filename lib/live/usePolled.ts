"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Keeps server-rendered data fresh in the visitor's own browser. The page
 * ships with the cached snapshot (fast first paint, crawlable), then this
 * hook swaps in fresh data every `intervalMs` — so the visible numbers are
 * live without every visitor adding load to a shared server quota (CORS-open
 * sources like DexScreener and Polymarket are rate-limited per visitor IP).
 *
 * - `fetcher` must THROW when it has nothing usable (empty/failed result);
 *   the previous data then stays on screen instead of being wiped.
 * - Pauses while the tab is hidden and refreshes immediately on return.
 * - Status: "stale" until the first success, "live" after a successful poll,
 *   "delayed" after 2 failures in a row (page keeps showing the last data).
 *
 * All setState calls happen after an await, never synchronously in the
 * effect body (react-hooks/set-state-in-effect).
 */
export function usePolled<T>(fetcher: () => Promise<T>, initial: T, intervalMs: number) {
  const [data, setData] = useState<T>(initial);
  const [status, setStatus] = useState<"live" | "stale" | "delayed">("stale");
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let failures = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (cancelled) return;
      timer = setTimeout(tick, intervalMs);
    };

    const tick = async () => {
      if (cancelled || inFlight) return;
      if (document.hidden) {
        schedule(); // skip the request, check again next interval
        return;
      }
      inFlight = true;
      try {
        const next = await fetcherRef.current();
        if (!cancelled) {
          setData(next);
          setStatus("live");
          failures = 0;
        }
      } catch {
        failures += 1;
        if (!cancelled && failures >= 2) setStatus("delayed");
      } finally {
        inFlight = false;
        schedule();
      }
    };

    const onVisible = () => {
      if (document.hidden) return;
      if (timer) clearTimeout(timer);
      void tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    void tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);

  return { data, status };
}
