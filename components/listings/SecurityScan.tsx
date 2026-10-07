"use client";

import { useState } from "react";
import { CheckCircle2, ShieldCheck, TriangleAlert, XCircle } from "lucide-react";
import type { SecurityCheck, SecurityReport } from "@/lib/risk/goplus";

type State =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "done"; report: SecurityReport }
  | { phase: "message"; text: string };

const ICON = {
  ok: <CheckCircle2 className="h-[17px] w-[17px] shrink-0 text-pos" strokeWidth={2} />,
  warn: <TriangleAlert className="h-[17px] w-[17px] shrink-0 text-warn" strokeWidth={2} />,
  bad: <XCircle className="h-[17px] w-[17px] shrink-0 text-neg" strokeWidth={2} />,
} as const;

const VERDICT: Record<SecurityCheck["status"], string> = {
  ok: "No contract red flags found",
  warn: "Some contract warnings",
  bad: "Serious contract red flags",
};

/** On-demand contract scan. Nothing is fetched until the user asks, so a
 * list of 30 tokens costs zero scan calls; each scanned token is then
 * CDN-cached for everyone (see app/api/risk/route.ts). */
export function SecurityScan({ chain, address }: { chain: string; address: string }) {
  const [state, setState] = useState<State>({ phase: "idle" });

  async function run() {
    setState({ phase: "loading" });
    try {
      const res = await fetch(`/api/risk?chain=${encodeURIComponent(chain)}&address=${encodeURIComponent(address)}`);
      const json = await res.json();
      if (json.ok) setState({ phase: "done", report: json.report });
      else if (json.reason === "unsupported-chain")
        setState({ phase: "message", text: "Contract scans aren't available on this chain yet." });
      else if (json.reason === "not-indexed")
        setState({ phase: "message", text: "This token is too new to be indexed by the scanner. Check back in a few minutes." });
      else setState({ phase: "message", text: "The scanner didn't respond. Try again in a moment." });
    } catch {
      setState({ phase: "message", text: "Couldn't reach the scanner. Check your connection and try again." });
    }
  }

  if (state.phase === "done") {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-[14px] font-semibold tracking-[-0.01em]">
          {ICON[state.report.verdict]}
          {VERDICT[state.report.verdict]}
        </div>
        <ul className="flex flex-col gap-2">
          {state.report.checks.map((c) => (
            <li key={c.label} className="flex items-start gap-2.5 text-[13.5px] leading-snug">
              {ICON[c.status]}
              <span>
                <span className="font-medium text-ink-100">{c.label}.</span> <span className="text-ink-300">{c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="text-[12px] text-ink-400">Contract data from GoPlus. It checks the code, not the team&apos;s intentions.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {state.phase === "message" && <p className="text-[13.5px] text-ink-300">{state.text}</p>}
      <button
        onClick={run}
        disabled={state.phase === "loading"}
        className="press inline-flex h-[38px] items-center gap-2 self-start rounded-full bg-accent-soft px-4 text-[14px] font-semibold text-accent disabled:opacity-60"
      >
        <ShieldCheck className="h-4 w-4" strokeWidth={2} />
        {state.phase === "loading" ? "Scanning…" : state.phase === "message" ? "Try again" : "Run security scan"}
      </button>
    </div>
  );
}
