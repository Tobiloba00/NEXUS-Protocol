import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { Brief } from "@/lib/ai/brief";

function formatDay(day: string) {
  // Fixed locale + UTC so server and browser agree.
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
}

/** The AI-written daily brief. Plain text, server-rendered (so it's real
 * crawlable content), and labelled honestly as machine-written. */
export function BriefCard({ brief }: { brief: Brief }) {
  const paragraphs = brief.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <section>
      <div className="mb-3 flex min-h-[34px] items-center justify-between gap-3 px-1">
        <h2 className="t-title">Today&apos;s brief</h2>
        <span className="text-[13px] text-ink-400">{formatDay(brief.day)}</span>
      </div>
      <div className="group-card flex flex-col gap-3.5 p-5 sm:p-6">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-[16px] leading-relaxed tracking-[-0.01em] text-ink-100">
            {p}
          </p>
        ))}
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-3.5">
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-400">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Written by AI from live NEXUS data · not financial advice
          </span>
          <Link href="/ask" className="press text-[14px] font-medium text-accent">
            Ask a follow-up
          </Link>
        </div>
      </div>
    </section>
  );
}
