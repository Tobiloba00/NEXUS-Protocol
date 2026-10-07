"use client";

import { useTradeTape } from "@/lib/exchanges/useTradeTape";

function formatPrice(p: number) {
  return p < 1 ? p.toPrecision(4) : p.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString("en-US", { hour12: false });
}

export function TradeTape({ symbol }: { symbol: string }) {
  const trades = useTradeTape(symbol);

  return (
    <section className="group-card p-4">
      <h3 className="t-headline mb-3 px-1">Recent Trades</h3>
      <div className="flex flex-col gap-px">
        {trades.slice(0, 14).map((t, i) => (
          <div key={`${t.time}-${i}`} className="flex items-center justify-between px-2.5 py-[3px] text-[13px] tabular-nums">
            <span className="w-[68px] text-ink-400">{formatTime(t.time)}</span>
            <span className={`font-medium ${t.side === "buy" ? "text-pos" : "text-neg"}`}>{formatPrice(t.price)}</span>
            <span className="w-[72px] text-right text-ink-300">{t.qty.toFixed(4)}</span>
          </div>
        ))}
        {trades.length === 0 && <p className="px-1 py-6 text-center text-[13px] text-ink-400">Waiting for trades…</p>}
      </div>
    </section>
  );
}
