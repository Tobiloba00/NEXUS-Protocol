"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { Brief } from "@/lib/ai/brief";

function formatDay(day: string) {
  // Fixed locale + UTC so server and browser agree.
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
}

/** The AI-written daily brief. Plain text (the full text is always in the
 * HTML, so it's real crawlable content), labelled honestly as machine-written.
 * On phones it's collapsed to the first lines with "Read more", so it never
 * pushes the live price off the screen. */
export function BriefCard({ brief }: { brief: Brief }) {
  const [open, setOpen] = useState(false);
  const paragraphs = brief.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <section>
      <div className="mb-3 flex min-h-[34px] items-center justify-between gap-3 px-1">
        <h2 className="t-title">Today&apos;s brief</h2>
        <span className="text-[13px] text-ink-400">{formatDay(brief.day)}</span>
      </div>
      <div className="group-card p-5 sm:p-6">
        <div className={`relative flex flex-col gap-3.5 ${open ? "" : "max-h-[7.4rem] overflow-hidden md:max-h-none"}`}>
          {paragraphs.map((p, i) => (
            <p key={i} className="text-[16px] leading-relaxed tracking-[-0.01em] text-ink-100">
              {p}
            </p>
          ))}
          {!open && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-surface to-transparent md:hidden" />
          )}
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="press mt-2 h-11 text-[15px] font-medium text-accent md:hidden"
        >
          {open ? "Show less" : "Read more"}
        </button>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-3.5">
          <span className="inline-flex items-start gap-1.5 text-[12.5px] leading-snug text-ink-400">
            <Sparkles className="mt-[2px] h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            Written by AI from live NEXUS data · information only, not financial advice · no liability for losses
          </span>
          <Link href="/ask" className="press text-[14px] font-medium text-accent">
            Ask a follow-up
          </Link>
        </div>
      </div>
    </section>
  );
}
