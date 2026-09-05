"use client";

import { useMarketDepth } from "@/lib/exchanges/useMarketDepth";

function formatPrice(p: number) {
  return p < 1 ? p.toPrecision(4) : p.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/** Depth-only display — no trading, matches the plan's "display, don't
 * execute" scope. Row width encodes relative size within the visible book
 * so depth is visually scannable, not just a column of numbers. */
export function OrderBook({ symbol, rows = 8 }: { symbol: string; rows?: number }) {
  const depth = useMarketDepth(symbol);

  if (!depth) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl2 border border-line bg-surface p-4 text-xs text-ink-500">
        Order book unavailable
      </div>
    );
  }

  const asks = depth.asks.slice(0, rows).reverse(); // lowest ask last -> renders just above the spread
  const bids = depth.bids.slice(0, rows);
  const maxQty = Math.max(...asks.map((a) => a[1]), ...bids.map((b) => b[1]), 1);
  const bestBid = bids[0]?.[0];
  const bestAsk = depth.asks[0]?.[0];
  const spread = bestBid && bestAsk ? bestAsk - bestBid : null;

  return (
    <div className="flex flex-col rounded-xl2 border border-line bg-surface p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">Order Book</h3>
      <div className="flex flex-col gap-0.5">
        {asks.map(([price, qty]) => (
          <Row key={`a-${price}`} price={price} qty={qty} maxQty={maxQty} side="ask" />
        ))}
      </div>
      {spread !== null && (
        <div className="my-1.5 flex items-center justify-between border-y border-line py-1 text-xs">
          <span className="text-ink-500">Spread</span>
          <span className="tabular-nums text-ink-300">{formatPrice(spread)}</span>
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        {bids.map(([price, qty]) => (
          <Row key={`b-${price}`} price={price} qty={qty} maxQty={maxQty} side="bid" />
        ))}
      </div>
    </div>
  );
}

function Row({ price, qty, maxQty, side }: { price: number; qty: number; maxQty: number; side: "bid" | "ask" }) {
  const pct = Math.min(100, (qty / maxQty) * 100);
  return (
    <div className="relative flex items-center justify-between overflow-hidden rounded px-1.5 py-0.5 text-xs tabular-nums">
      <div
        className="absolute inset-y-0 right-0"
        style={{ width: `${pct}%`, background: side === "bid" ? "var(--pos-soft)" : "var(--neg-soft)" }}
      />
      <span className={`relative ${side === "bid" ? "text-pos" : "text-neg"}`}>{formatPrice(price)}</span>
      <span className="relative text-ink-400">{qty.toFixed(4)}</span>
    </div>
  );
}
