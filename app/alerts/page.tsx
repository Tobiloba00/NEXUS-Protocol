"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Bell, Trash2 } from "lucide-react";
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
const USERNAME_KEY = "nexus-telegram-username";

function randomCode() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export default function AlertsPage() {
  const [linkCode, setLinkCode] = useLocalStorageValue(LINK_CODE_KEY);
  const [chatId, setChatId] = useLocalStorageValue(CHAT_ID_KEY);
  const [username, setUsername] = useLocalStorageValue(USERNAME_KEY);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [checking, setChecking] = useState(false);
  const [symbol, setSymbol] = useState(LAUNCH_PAIRS[0].base);
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [threshold, setThreshold] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  useEffect(() => {
    if (!linkCode) setLinkCode(randomCode());
  }, [linkCode, setLinkCode]);

  async function refreshRules(id: string) {
    const res = await fetch(`/api/alerts?chatId=${encodeURIComponent(id)}`);
    const json = await res.json();
    if (json.ok) setRules(json.rules);
  }

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
      if (json.ok && json.chatId) {
        setChatId(String(json.chatId));
        if (json.username) setUsername(json.username);
      }
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
    <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-xl font-semibold">Alerts</h1>
        <p className="mt-1 text-sm text-ink-400">Free price alerts, delivered via Telegram.</p>
      </div>

      {!chatId ? (
        <div className="flex flex-col gap-3 rounded-xl2 border border-line bg-surface p-4">
          <p className="text-sm text-ink-300">Connect once, then create as many alerts as you like.</p>
          {botUsername ? (
            <a
              href={`https://t.me/${botUsername}?start=${linkCode ?? ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white"
            >
              <Bell className="h-4 w-4" />
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
          <div className="flex items-center justify-between rounded-xl2 border border-line bg-surface p-3.5">
            <div className="flex items-center gap-2 text-sm">
              <Bell className="h-4 w-4 text-accent" />
              <span>Connected to Telegram{username ? ` · @${username}` : ""}</span>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-pos-soft px-2 py-1 text-xs font-medium text-pos">
              <CheckCircle2 className="h-3 w-3" />
              Connected
            </span>
          </div>

          <form onSubmit={createAlert} className="flex flex-col gap-3 rounded-xl2 border border-line bg-surface p-4">
            <h3 className="text-sm font-semibold">Create Alert</h3>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs text-ink-400">
                Pair
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink-50"
                >
                  {LAUNCH_PAIRS.map((p) => (
                    <option key={p.base} value={p.base}>
                      {p.base}/{p.quote}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-ink-400">
                Condition
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as "above" | "below")}
                  className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink-50"
                >
                  <option value="above">Price above</option>
                  <option value="below">Price below</option>
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-1 text-xs text-ink-400">
              Price
              <div className="flex items-center rounded-lg border border-line bg-surface-2 px-3">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="70000"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-full bg-transparent py-2 text-sm text-ink-50 outline-none"
                />
                <span className="text-xs text-ink-500">USDT</span>
              </div>
            </label>
            {formError && <p className="text-xs text-neg">{formError}</p>}
            <button type="submit" className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white">
              Create Alert
            </button>
          </form>

          <div>
            <h3 className="mb-2 text-sm font-semibold">My Alerts</h3>
            <ul className="flex flex-col divide-y divide-line rounded-xl2 border border-line bg-surface">
              {rules.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium">
                      {r.symbol}/USDT
                    </div>
                    <div className="text-xs text-ink-400">
                      Price {r.direction} ${r.threshold.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-pos-soft px-2 py-0.5 text-xs font-medium text-pos">Active</span>
                    <button onClick={() => deleteAlert(r.id)} className="text-ink-400 hover:text-neg">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
              {rules.length === 0 && <li className="px-4 py-6 text-sm text-ink-400">No active alerts yet.</li>}
            </ul>
          </div>
        </>
      )}
    </main>
  );
}
