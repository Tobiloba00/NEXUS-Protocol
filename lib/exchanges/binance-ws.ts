/**
 * Client-side WebSocket manager for Binance's public market-data streams —
 * free, keyless, no backend hop (see plan: "Live ticks: browser -> exchange
 * WebSocket directly. Never touches Vercel/Supabase after initial page
 * load."). A single combined-stream connection is shared across every
 * subscriber in the tab, not one socket per chart/ticker.
 *
 * Streams used:
 *  - <symbol>@ticker   -> 24h rolling ticker (price, % change) for ticker UI
 *  - <symbol>@kline_1m -> live-updating 1m candle for chart append
 *
 * This module must only ever run in the browser — it's imported solely
 * from "use client" components and only touches `WebSocket` inside
 * connect(), never at module scope, so it's safe even without a dynamic-
 * import(ssr:false) guard.
 */

export type BinanceTicker = {
  symbol: string;
  price: number;
  changePct24h: number;
};

export type BinanceKline = {
  symbol: string;
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  isClosed: boolean;
};

type Listener = {
  ticker?: (t: BinanceTicker) => void;
  kline?: (k: BinanceKline) => void;
};

const WS_BASE = "wss://stream.binance.com:9443/stream";
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30000;
const STALE_AFTER_MS = 15000; // if no message arrives in this window, flip to "stale"

class BinanceWsManager {
  private ws: WebSocket | null = null;
  private subs = new Map<string, Set<Listener>>(); // key: `${symbol}@${stream}`
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private staleTimer: ReturnType<typeof setTimeout> | null = null;
  private statusListeners = new Set<(status: "live" | "stale" | "connecting") => void>();
  // Distinguishes "we closed this socket ourselves to pick up a changed
  // subscription list" from "the connection actually dropped" — without
  // this, every resubscribe (e.g. several tickers mounting in the same
  // tick) would walk the same exponential backoff as a real failure and
  // get progressively slower to reconnect.
  private closingIntentionally = false;

  private setStatus(status: "live" | "stale" | "connecting") {
    this.statusListeners.forEach((cb) => cb(status));
  }

  onStatusChange(cb: (status: "live" | "stale" | "connecting") => void) {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  private resetStaleTimer() {
    if (this.staleTimer) clearTimeout(this.staleTimer);
    this.setStatus("live");
    this.staleTimer = setTimeout(() => this.setStatus("stale"), STALE_AFTER_MS);
  }

  private buildStreamUrl(): string {
    const streams = Array.from(this.subs.keys()).join("/");
    return `${WS_BASE}?streams=${streams}`;
  }

  private connect() {
    if (this.subs.size === 0) return;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.setStatus("connecting");
    const socket = new WebSocket(this.buildStreamUrl());
    this.ws = socket;

    socket.addEventListener("open", () => {
      this.reconnectAttempt = 0;
      this.resetStaleTimer();
    });

    socket.addEventListener("message", (event) => {
      this.resetStaleTimer();
      try {
        const payload = JSON.parse(event.data as string);
        const streamKey: string = payload.stream;
        const data = payload.data;
        const listeners = this.subs.get(streamKey);
        if (!listeners) return;

        if (streamKey.endsWith("@ticker")) {
          const ticker: BinanceTicker = {
            symbol: data.s,
            price: Number(data.c),
            changePct24h: Number(data.P),
          };
          listeners.forEach((l) => l.ticker?.(ticker));
        } else if (streamKey.includes("@kline")) {
          const k = data.k;
          const kline: BinanceKline = {
            symbol: data.s,
            openTime: k.t,
            open: Number(k.o),
            high: Number(k.h),
            low: Number(k.l),
            close: Number(k.c),
            isClosed: k.x,
          };
          listeners.forEach((l) => l.kline?.(kline));
        }
      } catch (err) {
        console.warn("[binance-ws] failed to parse message", err);
      }
    });

    socket.addEventListener("close", () => {
      if (this.closingIntentionally) {
        this.closingIntentionally = false;
        this.connect(); // subscription list changed — reconnect immediately, no backoff
        return;
      }
      this.setStatus("stale");
      this.scheduleReconnect();
    });

    socket.addEventListener("error", () => {
      socket.close();
    });
  }

  private scheduleReconnect() {
    if (this.subs.size === 0) return; // nothing to reconnect for
    const delay = Math.min(
      RECONNECT_BASE_DELAY_MS * 2 ** this.reconnectAttempt,
      RECONNECT_MAX_DELAY_MS
    );
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  /** Subscribe to a symbol's ticker and/or kline stream. Returns an
   * unsubscribe function. Reconnects with the full updated stream list
   * whenever the subscription set changes. */
  subscribe(symbol: string, streams: ("ticker" | "kline_1m")[], listener: Listener): () => void {
    const lowerSymbol = symbol.toLowerCase();
    const keys = streams.map((s) => `${lowerSymbol}@${s}`);
    let needsReconnect = false;

    for (const key of keys) {
      let set = this.subs.get(key);
      if (!set) {
        set = new Set();
        this.subs.set(key, set);
        needsReconnect = true;
      }
      set.add(listener);
    }

    if (needsReconnect) {
      if (this.ws) {
        this.closingIntentionally = true;
        this.ws.close();
      } else {
        this.connect();
      }
    }

    return () => {
      for (const key of keys) {
        this.subs.get(key)?.delete(listener);
        if (this.subs.get(key)?.size === 0) this.subs.delete(key);
      }
      if (!this.ws) return;
      if (this.subs.size === 0) {
        this.closingIntentionally = true; // no reconnect wanted, but skip the backoff-vs-clean-close branching
        this.ws.close();
        this.ws = null;
      } else {
        // Stream list shrank — reconnect with the narrower list so we're
        // not paying for streams nobody's listening to anymore.
        this.closingIntentionally = true;
        this.ws.close();
      }
    };
  }
}

// Singleton — one shared connection per tab, matching the plan's "single
// shared WS connection per exchange per browser tab" design.
export const binanceWs = new BinanceWsManager();
