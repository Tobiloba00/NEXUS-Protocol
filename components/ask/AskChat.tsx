"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

type Message = { role: "user" | "assistant"; text: string; tools?: string[]; disclaimer?: string; error?: boolean };

/** A question handed in from elsewhere (an "AI insight" button). The id lets the same question be asked again. */
export type IncomingQuestion = { id: number; q: string };

const TOOL_LABEL: Record<string, string> = {
  get_market_overview: "Market overview",
  get_coin: "Live prices",
  get_top_movers: "Top movers",
  get_new_listings: "New listings & risk",
  get_prediction_markets: "Prediction markets",
  get_crowd_price_odds: "Crowd price odds",
  get_nft_collections: "NFT floors",
  get_news: "News headlines",
  get_nft_collection: "NFT collection stats",
  get_exchange_listings: "Exchange listings",
};

// Shown even if the server somehow omits one — an AI answer never appears without it.
const FALLBACK_DISCLAIMER = "AI-generated. Information only — not financial advice. NEXUS accepts no liability for any loss.";

const SUGGESTIONS = [
  "What's moving the most today?",
  "What does the crowd expect for Bitcoin by tomorrow?",
  "Which new Solana tokens look lowest risk?",
  "What are the top stories in crypto today?",
];

const MAX_LEN = 300;

/**
 * Chat UI for the Gemini assistant, used two ways:
 *  - "page": the full /ask page, with a composer that floats at the bottom;
 *  - "popup": inside the floating panel — fills its parent, scrolls its own
 *    messages, composer pinned underneath.
 * History lives in the browser only; the last few turns are sent along so
 * follow-ups ("and Ethereum?") work.
 */
export function AskChat({ variant = "page", incoming = null }: { variant?: "page" | "popup"; incoming?: IncomingQuestion | null }) {
  const popup = variant === "popup";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messages.length) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  // Questions pushed in from "AI insight" buttons elsewhere on the site.
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });
  useEffect(() => {
    if (incoming) void sendRef.current(incoming.q);
  }, [incoming?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
          ? { role: "assistant", text: json.answer, tools: json.tools, disclaimer: json.disclaimer ?? FALLBACK_DISCLAIMER }
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

  const composer = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void send(input);
      }}
      className={
        popup
          ? "flex shrink-0 items-center gap-2 rounded-full bg-surface-2 p-1.5 pl-4"
          : "glass sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-10 flex items-center gap-2 rounded-full border border-line p-1.5 pl-5 lg:bottom-6"
      }
    >
      <input
        ref={inputRef}
        value={input}
        maxLength={MAX_LEN}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask about prices, new tokens, news…"
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
  );

  const thread = (
    <>
      {messages.length === 0 && (
        <div className={popup ? "flex flex-col gap-3" : "group-card flex flex-col gap-4 p-5 sm:p-6"}>
          <div>
            <h2 className={popup ? "text-[17px] font-semibold tracking-[-0.015em]" : "t-title"}>Ask about the market</h2>
            <p className="mt-1 text-[14px] leading-snug text-ink-400">
              Answers come from NEXUS&apos;s live data — prices, listings and risk ratings, prediction odds and headlines.
              Information only, not financial advice.
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
              className={`max-w-[90%] whitespace-pre-line rounded-[22px] px-4 py-3 text-[15px] leading-snug tracking-[-0.01em] ${
                m.role === "user"
                  ? "rounded-br-md bg-accent text-white"
                  : m.error
                    ? "rounded-bl-md bg-neg-soft text-neg"
                    : popup
                      ? "rounded-bl-md bg-surface-2"
                      : "rounded-bl-md bg-surface"
              }`}
            >
              {m.text}
            </div>
            {m.role === "assistant" && !m.error && (
              <p className="max-w-[90%] px-2 text-[11.5px] leading-snug text-ink-400">
                {m.tools && m.tools.length > 0 && <>From live data: {m.tools.map((t) => TOOL_LABEL[t] ?? t).join(" · ")}. </>}
                {m.disclaimer ?? FALLBACK_DISCLAIMER}
              </p>
            )}
          </li>
        ))}
        {loading && (
          <li className="flex items-start" aria-label="Nexus is thinking">
            <div className={`flex items-center gap-1.5 rounded-[22px] rounded-bl-md px-4 py-4 ${popup ? "bg-surface-2" : "bg-surface"}`}>
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
    </>
  );

  if (popup) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain pr-1">{thread}</div>
        {composer}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {thread}
      {composer}
    </div>
  );
}
