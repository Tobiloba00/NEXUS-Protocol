"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X } from "lucide-react";
import { AskChat, type IncomingQuestion } from "./AskChat";

/** Any component can open the assistant with this (optionally with a question
 * to ask straight away); keeps the launcher decoupled from the rest of the UI. */
export const OPEN_ASK_EVENT = "nexus:open-ask";
export type OpenAskDetail = { question?: string };

/**
 * How far the on-screen keyboard covers the bottom of the layout viewport.
 * iPhone Safari doesn't shrink fixed-position elements when the keyboard
 * opens (it overlays them), which would hide the chat input exactly when you
 * need it. The visual viewport knows the real visible area, so the sheet is
 * lifted by this amount. Always 0 on tablets and desktops.
 */
function useKeyboardInset(active: boolean) {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!active || !vv) return;
    const update = () => {
      const phone = window.matchMedia("(max-width: 639px)").matches;
      setInset(phone ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0);
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    const raf = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(raf);
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [active]);
  return active ? inset : 0;
}

/**
 * The floating AI assistant. A round button bottom-right opens a chat panel
 * (a floating card on desktop, a full-height sheet on phones). The chat is
 * mounted once and only hidden when closed, so the conversation survives
 * closing and reopening and navigating between pages.
 */
export function AskLauncher() {
  const [open, setOpen] = useState(false);
  const [incoming, setIncoming] = useState<IncomingQuestion | null>(null);
  const pathname = usePathname();
  const onAskPage = pathname === "/ask";
  const keyboardInset = useKeyboardInset(open);

  // While the phone sheet is open, the page behind it must not scroll.
  useEffect(() => {
    if (!open || !window.matchMedia("(max-width: 639px)").matches) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    const openIt = (e: Event) => {
      setOpen(true);
      const question = (e as CustomEvent<OpenAskDetail>).detail?.question;
      if (question) setIncoming({ id: Date.now(), q: question });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener(OPEN_ASK_EVENT, openIt);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_ASK_EVENT, openIt);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (onAskPage) return null; // the full page is already the assistant

  return (
    <>
      {open && (
        <button
          aria-label="Close assistant"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-[var(--backdrop)] sm:hidden"
        />
      )}

      <section
        role="dialog"
        aria-label="Ask Nexus"
        aria-hidden={!open}
        style={keyboardInset ? { bottom: keyboardInset } : undefined}
        className={`fixed z-50 flex-col overflow-hidden bg-surface shadow-[var(--shadow-lg)] ${
          open ? "flex" : "hidden"
        } inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top)+56px)] rounded-t-[26px] sm:inset-x-auto sm:bottom-24 sm:right-6 sm:top-auto sm:h-[min(640px,calc(100vh-8rem))] sm:w-[400px] sm:rounded-[26px]`}
      >
        <header className="flex shrink-0 items-center justify-between px-5 pb-2 pt-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white">
              <Sparkles className="h-4 w-4" strokeWidth={2} />
            </span>
            <div className="leading-tight">
              <div className="text-[16px] font-semibold tracking-[-0.015em]">Ask Nexus</div>
              <div className="text-[12px] text-ink-400">AI · live data · not advice</div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="press flex h-9 w-9 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-hover"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </header>
        <div className="min-h-0 flex-1 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-1">
          <AskChat variant="popup" incoming={incoming} />
        </div>
      </section>

      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ask Nexus, the AI assistant"
          className="press fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-accent pl-4 pr-5 text-[15px] font-semibold text-white shadow-[0_8px_28px_-6px_color-mix(in_srgb,var(--accent)_70%,transparent)] sm:right-6 lg:bottom-6"
        >
          <Sparkles className="h-[18px] w-[18px]" strokeWidth={2.2} />
          Ask
        </button>
      )}
    </>
  );
}
