"use client";

import { useMarketDepth } from "@/lib/exchanges/useMarketDepth";

function formatPrice(p: number) {
  return p < 1 ? p.toPrecision(4) : p.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** Depth-only display — no trading, matches the plan's "display, don't
 * execute" scope. Each row's tinted bar encodes its size relative to the
 * rest of the visible book, so depth reads at a glance. */
export function OrderBook({ symbol, rows = 8 }: { symbol: string; rows?: number }) {
  const depth = useMarketDepth(symbol);

  if (!depth) {
    return (
      <section className="group-card flex h-full min-h-[200px] items-center justify-center p-5 text-[14px] text-ink-400">
        Order book unavailable
      </section>
    );
  }

  const asks = depth.asks.slice(0, rows).reverse(); // lowest ask last -> renders just above the spread
  const bids = depth.bids.slice(0, rows);
  const maxQty = Math.max(...asks.map((a) => a[1]), ...bids.map((b) => b[1]), 1);
  const bestBid = bids[0]?.[0];
  const bestAsk = depth.asks[0]?.[0];
  const spread = bestBid && bestAsk ? bestAsk - bestBid : null;

  return (
    <section className="group-card p-4">
      <h3 className="t-headline mb-3 px-1">Order Book</h3>
      <div className="flex flex-col gap-px">
        {asks.map(([price, qty]) => (
          <Row key={`a-${price}`} price={price} qty={qty} maxQty={maxQty} side="ask" />
        ))}
      </div>
      {spread !== null && (
        <div className="my-2 flex items-center justify-between rounded-lg bg-surface-2 px-2.5 py-1.5 text-[12.5px]">
          <span className="text-ink-400">Spread</span>
          <span className="font-medium tabular-nums text-ink-200">{formatPrice(spread)}</span>
        </div>
      )}
      <div className="flex flex-col gap-px">
        {bids.map(([price, qty]) => (
          <Row key={`b-${price}`} price={price} qty={qty} maxQty={maxQty} side="bid" />
        ))}
      </div>
    </section>
  );
}

function Row({ price, qty, maxQty, side }: { price: number; qty: number; maxQty: number; side: "bid" | "ask" }) {
  const pct = Math.min(100, (qty / maxQty) * 100);
  return (
    <div className="relative flex items-center justify-between overflow-hidden rounded-md px-2.5 py-[3px] text-[13px] tabular-nums">
      <div
        className="absolute inset-y-0 right-0 transition-[width] duration-300"
        style={{ width: `${pct}%`, background: side === "bid" ? "var(--pos-soft)" : "var(--neg-soft)" }}
      />
      <span className={`relative font-medium ${side === "bid" ? "text-pos" : "text-neg"}`}>{formatPrice(price)}</span>
      <span className="relative text-ink-300">{qty.toFixed(4)}</span>
    </div>
  );
}
