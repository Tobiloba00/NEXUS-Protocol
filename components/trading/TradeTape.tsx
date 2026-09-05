"use client";

import { useTradeTape } from "@/lib/exchanges/useTradeTape";

function formatPrice(p: number) {
  return p < 1 ? p.toPrecision(4) : p.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString(undefined, { hour12: false });
}

export function TradeTape({ symbol }: { symbol: string }) {
  const trades = useTradeTape(symbol);

  return (
    <div className="flex flex-col rounded-xl2 border border-line bg-surface p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">Recent Trades</h3>
      <div className="flex items-center justify-between px-1.5 pb-1.5 text-[10px] uppercase tracking-wider text-ink-500">
        <span>Time</span>
        <span>Price</span>
        <span>Amount</span>
      </div>
      <div className="flex flex-col gap-0.5">
        {trades.map((t, i) => (
          <div key={`${t.time}-${i}`} className="flex items-center justify-between px-1.5 py-0.5 text-xs tabular-nums">
            <span className="text-ink-500">{formatTime(t.time)}</span>
            <span className={t.side === "buy" ? "text-pos" : "text-neg"}>{formatPrice(t.price)}</span>
            <span className="text-ink-400">{t.qty.toFixed(4)}</span>
          </div>
        ))}
        {trades.length === 0 && <p className="px-1.5 py-4 text-center text-xs text-ink-500">Waiting for trades…</p>}
      </div>
    </div>
  );
}
