"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Bell, Trash2 } from "lucide-react";
import { useLocalStorageValue } from "@/lib/client/useLocalStorageValue";
import { LAUNCH_PAIRS } from "@/lib/exchanges/pairs";
import { Page, PageHeader } from "@/components/layout/Page";

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

  const field =
    "w-full bg-transparent text-right text-[16px] tracking-[-0.01em] text-ink-50 outline-none placeholder:text-ink-500";

  return (
    <Page narrow>
      <PageHeader title="Alerts" subtitle="Free price alerts, delivered to you on Telegram." />

      {!chatId ? (
        <section className="group-card flex flex-col items-center gap-5 px-6 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Bell className="h-7 w-7" strokeWidth={1.75} />
          </span>
          <div className="flex max-w-sm flex-col gap-1.5">
            <h2 className="t-title">Connect Telegram</h2>
            <p className="text-[15px] leading-snug text-ink-400">
              Link your account once, then create as many price alerts as you like.
            </p>
          </div>
          <div className="flex w-full max-w-sm flex-col gap-2.5">
            {botUsername ? (
              <a
                href={`https://t.me/${botUsername}?start=${linkCode ?? ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="press flex h-[50px] items-center justify-center rounded-[14px] bg-accent text-[16px] font-semibold text-white"
              >
                Open Telegram
              </a>
            ) : (
              <p className="text-[13px] text-ink-400">
                The bot isn&apos;t configured yet (NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is missing).
              </p>
            )}
            <button
              onClick={checkLinked}
              disabled={checking}
              className="press h-[44px] rounded-[14px] text-[15px] font-medium text-accent disabled:opacity-50"
            >
              {checking ? "Checking…" : "I've connected — check"}
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="group-card flex items-center gap-3.5 px-4 py-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Bell className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[16px] font-semibold tracking-[-0.015em]">Telegram</div>
              <div className="truncate text-[13px] text-ink-400">{username ? `@${username}` : "Connected"}</div>
            </div>
            <span className="flex items-center gap-1 text-[13px] font-medium text-pos">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
              Connected
            </span>
          </section>

          <form onSubmit={createAlert} className="flex flex-col gap-3">
            <h2 className="t-title px-1">New alert</h2>
            <div className="group-card" style={{ "--sep-inset": "16px" } as React.CSSProperties}>
              <label className="list-row flex items-center justify-between gap-4 px-4 py-3.5">
                <span className="text-[16px]">Pair</span>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="cursor-pointer bg-transparent text-right text-[16px] text-ink-300 outline-none"
                >
                  {LAUNCH_PAIRS.map((p) => (
                    <option key={p.base} value={p.base}>
                      {p.base}/{p.quote}
                    </option>
                  ))}
                </select>
              </label>
              <label className="list-row flex items-center justify-between gap-4 px-4 py-3.5">
                <span className="text-[16px]">When price is</span>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as "above" | "below")}
                  className="cursor-pointer bg-transparent text-right text-[16px] text-ink-300 outline-none"
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
              </label>
              <label className="list-row flex items-center justify-between gap-4 px-4 py-3.5">
                <span className="text-[16px]">Price</span>
                <span className="flex items-center gap-1.5">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="70,000"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className={field}
                  />
                  <span className="text-[14px] text-ink-400">USDT</span>
                </span>
              </label>
            </div>
            {formError && <p className="px-1 text-[13px] text-neg">{formError}</p>}
            <button
              type="submit"
              className="press h-[50px] rounded-[14px] bg-accent text-[16px] font-semibold text-white"
            >
              Create alert
            </button>
          </form>

          <section>
            <h2 className="t-title mb-3 px-1">Active alerts</h2>
            <ul className="group-card" style={{ "--sep-inset": "16px" } as React.CSSProperties}>
              {rules.map((r) => (
                <li key={r.id} className="list-row flex items-center gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[16px] font-semibold tracking-[-0.015em]">{r.symbol}/USDT</div>
                    <div className="text-[13px] text-ink-400">
                      {r.direction === "above" ? "Above" : "Below"} ${r.threshold.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAlert(r.id)}
                    className="press flex h-9 w-9 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-neg-soft hover:text-neg"
                    aria-label={`Delete ${r.symbol} alert`}
                  >
                    <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </button>
                </li>
              ))}
              {rules.length === 0 && (
                <li className="px-4 py-10 text-center text-[15px] text-ink-400">No active alerts yet.</li>
              )}
            </ul>
          </section>
        </>
      )}
    </Page>
  );
}
