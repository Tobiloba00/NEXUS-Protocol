"use client";

import { useEffect, useState } from "react";
import { useLocalStorageValue } from "@/lib/client/useLocalStorageValue";
import { LAUNCH_PAIRS } from "@/lib/exchanges/pairs";

type AlertRule = {
  id: string;
  symbol: string;
  direction: "above" | "below";
  threshold: number;
};

const LINK_CODE_KEY = "nexus-telegram-link-code";
const CHAT_ID_KEY = "nexus-telegram-chat-id";

function randomCode() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export default function AlertsPage() {
  const [linkCode, setLinkCode] = useLocalStorageValue(LINK_CODE_KEY);
  const [chatId, setChatId] = useLocalStorageValue(CHAT_ID_KEY);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [checking, setChecking] = useState(false);
  const [symbol, setSymbol] = useState(LAUNCH_PAIRS[0].base);
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [threshold, setThreshold] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  // Ensure a link code exists once we're on the client (localStorage isn't
  // available during SSR) — this is a plain effect writing to an external
  // store, not a setState call, so it doesn't need useSyncExternalStore.
  useEffect(() => {
    if (!linkCode) setLinkCode(randomCode());
  }, [linkCode, setLinkCode]);

  async function refreshRules(id: string) {
    const res = await fetch(`/api/alerts?chatId=${encodeURIComponent(id)}`);
    const json = await res.json();
    if (json.ok) setRules(json.rules);
  }

  // Fetches directly inside the effect (rather than calling the shared
  // refreshRules helper below, which the other call sites use after a
  // user action) so the setState it produces happens inside this effect's
  // own async continuation, not synchronously in the effect body —
  // satisfies react-hooks/set-state-in-effect. `cancelled` guards against
  // setting state from a stale request if chatId changes mid-flight.
  useEffect(() => {
    if (!chatId) return;
    let cancelled = false;
    fetch(`/api/alerts?chatId=${encodeURIComponent(chatId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.ok) setRules(json.rules);
      });
    return () => {
      cancelled = true;
    };
  }, [chatId]);

  async function checkLinked() {
    if (!linkCode) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/telegram/status?code=${encodeURIComponent(linkCode)}`);
      const json = await res.json();
      if (json.ok && json.chatId) setChatId(String(json.chatId));
    } finally {
      setChecking(false);
    }
  }

  async function createAlert(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsedThreshold = Number(threshold);
    if (!chatId || !Number.isFinite(parsedThreshold) || parsedThreshold <= 0) {
      setFormError("Enter a valid price.");
      return;
    }
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chatId, symbol, direction, threshold: parsedThreshold }),
    });
    const json = await res.json();
    if (!json.ok) {
      setFormError(json.error ?? "Failed to create alert.");
      return;
    }
    setThreshold("");
    refreshRules(chatId);
  }

  async function deleteAlert(id: string) {
    if (!chatId) return;
    await fetch(`/api/alerts/${id}?chatId=${encodeURIComponent(chatId)}`, { method: "DELETE" });
    refreshRules(chatId);
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-12">
      <h1 className="text-xl font-semibold">Price Alerts</h1>

      {!chatId ? (
        <div className="flex flex-col gap-3 rounded-xl2 border border-line bg-surface p-4">
          <p className="text-sm text-ink-300">
            Alerts are delivered via Telegram. Connect once, then create as many as you like.
          </p>
          {botUsername ? (
            <a
              href={`https://t.me/${botUsername}?start=${linkCode ?? ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-accent px-4 py-2 text-center text-sm font-medium text-white"
            >
              Connect Telegram
            </a>
          ) : (
            <p className="text-xs text-ink-500">
              Bot isn&apos;t configured yet (NEXT_PUBLIC_TELEGRAM_BOT_USERNAME missing).
            </p>
          )}
          <button
            onClick={checkLinked}
            disabled={checking}
            className="rounded-lg border border-line px-4 py-2 text-sm text-ink-200 hover:bg-hover disabled:opacity-50"
          >
            {checking ? "Checking…" : "I've connected — check"}
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={createAlert} className="flex flex-col gap-3 rounded-xl2 border border-line bg-surface p-4">
            <div className="flex gap-2">
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="flex-1 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm"
              >
                {LAUNCH_PAIRS.map((p) => (
                  <option key={p.base} value={p.base}>
                    {p.base}
                  </option>
                ))}
              </select>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as "above" | "below")}
                className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm"
              >
                <option value="above">above</option>
                <option value="below">below</option>
              </select>
              <input
                type="number"
                inputMode="decimal"
                placeholder="Price"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-28 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm"
              />
            </div>
            {formError && <p className="text-xs text-neg">{formError}</p>}
            <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white">
              Create alert
            </button>
          </form>

          <ul className="flex flex-col divide-y divide-line rounded-xl2 border border-line bg-surface">
            {rules.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>
                  {r.symbol} {r.direction} ${r.threshold.toLocaleString()}
                </span>
                <button onClick={() => deleteAlert(r.id)} className="text-xs text-ink-400 hover:text-neg">
                  Remove
                </button>
              </li>
            ))}
            {rules.length === 0 && <li className="px-4 py-6 text-sm text-ink-400">No active alerts yet.</li>}
          </ul>
        </>
      )}
    </main>
  );
}
