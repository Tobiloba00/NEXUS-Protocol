/**
 * Client-side WebSocket manager for Bybit's public spot market-data stream
 * (wss://stream.bybit.com/v5/public/spot) — free, keyless. Same shared-
 * connection design as binance-ws.ts, adapted to Bybit's protocol:
 * JSON {op:"subscribe", args:[...]} messages instead of URL-encoded
 * streams, and an explicit {op:"ping"} required every ~20s or the server
 * drops the connection.
 *
 * Topics used:
 *  - tickers.<SYMBOL>     -> 24h ticker (price, % change)
 *  - publicTrade.<SYMBOL> -> individual trade prints, self-contained (no
 *    snapshot/delta merging needed, unlike Bybit's orderbook topic — which
 *    is why order-book depth stays Binance-only for now, see PriceChart's
 *    OrderBook component).
 */

export type BybitTicker = {
  symbol: string;
  price: number;
  changePct24h: number;
};

export type BybitTrade = {
  price: number;
  qty: number;
  time: number;
  side: "buy" | "sell";
};

type Listener = {
  ticker?: (t: BybitTicker) => void;
  trade?: (t: BybitTrade) => void;
};

export type BybitTopic = "tickers" | "publicTrade";

const WS_URL = "wss://stream.bybit.com/v5/public/spot";
const PING_INTERVAL_MS = 18000;
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30000;
const STALE_AFTER_MS = 15000;

class BybitWsManager {
  private ws: WebSocket | null = null;
  private subs = new Map<string, Set<Listener>>(); // key: `${topic}.${SYMBOL}`, e.g. "tickers.BTCUSDT"
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private staleTimer: ReturnType<typeof setTimeout> | null = null;
  private closingIntentionally = false;
  private statusListeners = new Set<(status: "live" | "stale" | "connecting") => void>();

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

  private connect() {
    if (this.subs.size === 0) return;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.setStatus("connecting");
    const socket = new WebSocket(WS_URL);
    this.ws = socket;

    socket.addEventListener("open", () => {
      this.reconnectAttempt = 0;
      socket.send(JSON.stringify({ op: "subscribe", args: Array.from(this.subs.keys()) }));
      this.pingTimer = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ op: "ping" }));
      }, PING_INTERVAL_MS);
      this.resetStaleTimer();
    });

    socket.addEventListener("message", (event) => {
      this.resetStaleTimer();
      try {
        const payload = JSON.parse(event.data as string);
        const topicKey: string | undefined = payload.topic; // e.g. "tickers.BTCUSDT" or "publicTrade.BTCUSDT"
        if (!topicKey) return;
        const listeners = this.subs.get(topicKey);
        if (!listeners) return;

        if (topicKey.startsWith("tickers.")) {
          const d = payload.data;
          if (d?.lastPrice === undefined) return;
          const ticker: BybitTicker = {
            symbol: topicKey.slice("tickers.".length),
            price: Number(d.lastPrice),
            changePct24h: Number(d.price24hPcnt ?? 0) * 100,
          };
          listeners.forEach((l) => l.ticker?.(ticker));
        } else if (topicKey.startsWith("publicTrade.")) {
          const rows: Array<{ p: string; v: string; T: number; S: "Buy" | "Sell" }> = payload.data ?? [];
          for (const r of rows) {
            const trade: BybitTrade = {
              price: Number(r.p),
              qty: Number(r.v),
              time: r.T,
              side: r.S === "Buy" ? "buy" : "sell",
            };
            listeners.forEach((l) => l.trade?.(trade));
          }
        }
      } catch (err) {
        console.warn("[bybit-ws] failed to parse message", err);
      }
    });

    socket.addEventListener("close", () => {
      if (this.pingTimer) {
        clearInterval(this.pingTimer);
        this.pingTimer = null;
      }
      if (this.closingIntentionally) {
        this.closingIntentionally = false;
        this.connect();
        return;
      }
      this.setStatus("stale");
      this.scheduleReconnect();
    });

    socket.addEventListener("error", () => socket.close());
  }

  private scheduleReconnect() {
    if (this.subs.size === 0) return;
    const delay = Math.min(
      RECONNECT_BASE_DELAY_MS * 2 ** this.reconnectAttempt,
      RECONNECT_MAX_DELAY_MS
    );
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  subscribe(symbol: string, topics: BybitTopic[], listener: Listener): () => void {
    const upperSymbol = symbol.toUpperCase();
    const keys = topics.map((t) => `${t}.${upperSymbol}`);
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
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ op: "subscribe", args: keys }));
        this.resetStaleTimer();
      } else if (!this.ws) {
        this.connect();
      }
      // If a socket exists but isn't open yet, the `open` handler
      // subscribes to the full current topic list already.
    }

    return () => {
      for (const key of keys) {
        this.subs.get(key)?.delete(listener);
        if (this.subs.get(key)?.size === 0) {
          this.subs.delete(key);
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ op: "unsubscribe", args: [key] }));
          }
        }
      }
      if (this.subs.size === 0 && this.ws) {
        this.closingIntentionally = true;
        this.ws.close();
        this.ws = null;
      }
    };
  }
}

export const bybitWs = new BybitWsManager();
