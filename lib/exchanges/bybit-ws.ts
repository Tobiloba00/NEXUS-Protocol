/**
 * Client-side WebSocket manager for Bybit's public spot market-data stream
 * (wss://stream.bybit.com/v5/public/spot) — free, keyless. Same shared-
 * connection design as binance-ws.ts, adapted to Bybit's protocol:
 * JSON {op:"subscribe", args:[...]} messages instead of URL-encoded
 * streams, and an explicit {op:"ping"} required every ~20s or the server
 * drops the connection.
 */

export type BybitTicker = {
  symbol: string;
  price: number;
  changePct24h: number;
};

type TickerListener = (t: BybitTicker) => void;

const WS_URL = "wss://stream.bybit.com/v5/public/spot";
const PING_INTERVAL_MS = 18000;
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30000;
const STALE_AFTER_MS = 15000;

class BybitWsManager {
  private ws: WebSocket | null = null;
  private subs = new Map<string, Set<TickerListener>>(); // key: symbol, e.g. "BTCUSDT"
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
      socket.send(JSON.stringify({ op: "subscribe", args: this.topics() }));
      this.pingTimer = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ op: "ping" }));
      }, PING_INTERVAL_MS);
      this.resetStaleTimer();
    });

    socket.addEventListener("message", (event) => {
      this.resetStaleTimer();
      try {
        const payload = JSON.parse(event.data as string);
        if (payload.topic?.startsWith("tickers.")) {
          const symbol = payload.topic.slice("tickers.".length);
          const d = payload.data;
          if (d?.lastPrice === undefined) return;
          const ticker: BybitTicker = {
            symbol,
            price: Number(d.lastPrice),
            changePct24h: Number(d.price24hPcnt ?? 0) * 100,
          };
          this.subs.get(symbol)?.forEach((cb) => cb(ticker));
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

  private topics(): string[] {
    return Array.from(this.subs.keys()).map((symbol) => `tickers.${symbol}`);
  }

  subscribe(symbol: string, listener: TickerListener): () => void {
    const upperSymbol = symbol.toUpperCase();
    let set = this.subs.get(upperSymbol);
    const isNewTopic = !set;
    if (!set) {
      set = new Set();
      this.subs.set(upperSymbol, set);
    }
    set.add(listener);

    if (isNewTopic) {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ op: "subscribe", args: [`tickers.${upperSymbol}`] }));
        this.resetStaleTimer();
      } else if (!this.ws) {
        this.connect();
      }
      // If a socket exists but isn't open yet (still connecting), the
      // `open` handler subscribes to the full current topic list already.
    }

    return () => {
      set!.delete(listener);
      if (set!.size > 0) return;
      this.subs.delete(upperSymbol);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ op: "unsubscribe", args: [`tickers.${upperSymbol}`] }));
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
