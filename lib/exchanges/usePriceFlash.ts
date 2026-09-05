"use client";

import { useEffect, useState } from "react";

/**
 * Binance/Bybit's "right in your face" feel comes specifically from a
 * flash-on-tick convention, not from update frequency — a silent number
 * change (a few dollars on an $80,000 BTC price) is nearly invisible
 * without it. This was the actual bug behind "prices aren't updating
 * live, it's like a display": the WS data was very likely ticking
 * correctly the whole time, just with zero visual signal that it had.
 *
 * setFlash on price change happens during render (React's documented
 * "adjusting state when a prop changes" pattern — see
 * https://react.dev/learn/you-might-not-need-an-effect), not in an
 * effect body, so it doesn't trip react-hooks/set-state-in-effect. Only
 * clearing the flash after a timeout needs an effect, and that setState
 * happens inside the timeout's callback (a genuine async event), which
 * the rule allows.
 */
export function usePriceFlash(price: number | null) {
  const [prevPrice, setPrevPrice] = useState(price);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  if (price !== null && price !== prevPrice) {
    if (prevPrice !== null) setFlash(price > prevPrice ? "up" : "down");
    setPrevPrice(price);
  }

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 500);
    return () => clearTimeout(timer);
  }, [flash]);

  return flash;
}
