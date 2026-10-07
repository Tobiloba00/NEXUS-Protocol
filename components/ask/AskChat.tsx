"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

type Message = { role: "user" | "assistant"; text: string; tools?: string[]; error?: boolean };

const TOOL_LABEL: Record<string, string> = {
  get_market_overview: "Market overview",
  get_coin: "Live prices",
  get_top_movers: "Top movers",
  get_new_listings: "New listings & risk",
  get_prediction_markets: "Prediction markets",
  get_crowd_price_odds: "Crowd price odds",
  get_nft_collections: "NFT floors",
};

const SUGGESTIONS = [
  "What's moving the most today?",
  "What does the crowd expect for Bitcoin by tomorrow?",
  "Which new Solana tokens look lowest risk?",
  "What are the biggest prediction markets right now?",
];

const MAX_LEN = 300;

/** Chat UI for the Gemini assistant. History is kept in the browser only and
 * the last few turns are sent along so follow-ups ("and Ethereum?") work. */
export function AskChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messages.length) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function send(raw: string) {
    const question = raw.trim();
    if (!question || loading) return;
    const history = messages.filter((m) => !m.error).map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, history }),
      });
      const json = await res.json();
      setMessages((prev) => [
        ...prev,
        json.ok
          ? { role: "assistant", text: json.answer, tools: json.tools }
          : { role: "assistant", text: json.error ?? "Something went wrong. Please try again.", error: true },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Couldn't reach the assistant. Check your connection and try again.", error: true },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 && (
        <div className="group-card flex flex-col gap-4 p-5 sm:p-6">
          <div>
            <h2 className="t-title">Ask about the market</h2>
            <p className="mt-1 text-[15px] leading-snug text-ink-400">
              Answers come from NEXUS&apos;s live data — prices, new listings and their risk ratings, and prediction-market odds.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="press rounded-2xl bg-surface-2 px-4 py-3 text-left text-[15px] tracking-[-0.01em] transition-colors hover:bg-hover"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <ul className="flex flex-col gap-3" aria-live="polite">
        {messages.map((m, i) => (
          <li key={i} className={`flex flex-col gap-1.5 ${m.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[88%] whitespace-pre-line rounded-[22px] px-4 py-3 text-[15.5px] leading-snug tracking-[-0.01em] ${
                m.role === "user"
                  ? "rounded-br-md bg-accent text-white"
                  : m.error
                    ? "rounded-bl-md bg-neg-soft text-neg"
                    : "rounded-bl-md bg-surface"
              }`}
            >
              {m.text}
            </div>
            {m.tools && m.tools.length > 0 && (
              <p className="px-2 text-[12px] text-ink-400">
                From live data: {m.tools.map((t) => TOOL_LABEL[t] ?? t).join(" · ")}
              </p>
            )}
          </li>
        ))}
        {loading && (
          <li className="flex items-start" aria-label="Nexus is thinking">
            <div className="flex items-center gap-1.5 rounded-[22px] rounded-bl-md bg-surface px-4 py-4">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="h-[7px] w-[7px] animate-bounce rounded-full bg-ink-400"
                  style={{ animationDelay: `${d * 140}ms` }}
                />
              ))}
            </div>
          </li>
        )}
      </ul>
      <div ref={endRef} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="glass sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-10 flex items-center gap-2 rounded-full border border-line p-1.5 pl-5 lg:bottom-6"
      >
        <input
          ref={inputRef}
          value={input}
          maxLength={MAX_LEN}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about prices, new tokens, odds…"
          aria-label="Ask Nexus"
          className="min-w-0 flex-1 bg-transparent text-[16px] tracking-[-0.01em] outline-none placeholder:text-ink-400"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send"
          className="press flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-opacity disabled:opacity-35"
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2.6} />
        </button>
      </form>
    </div>
  );
}
