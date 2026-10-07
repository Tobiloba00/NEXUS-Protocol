"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { TERMS_STORAGE_KEY, TERMS_VERSION } from "@/lib/legal/terms";

/**
 * The agreement every visitor accepts before using NEXUS.
 *
 * Visibility is driven by CSS on <html data-terms="needed">, which an inline
 * script in app/layout.tsx sets BEFORE first paint when the visitor hasn't
 * accepted the current version. That means: no flash of un-gated content for
 * new visitors, and no flash of the dialog for returning ones. The page
 * content stays in the DOM underneath (this is an overlay, not a redirect),
 * so search engines can still read the site.
 *
 * Acceptance is an explicit affirmative act (ticking the box, then pressing
 * the button) and is stored with the version and a timestamp.
 */
export function TermsGate() {
  const [checked, setChecked] = useState(false);

  function accept() {
    try {
      localStorage.setItem(TERMS_STORAGE_KEY, JSON.stringify({ v: TERMS_VERSION, at: new Date().toISOString() }));
    } catch {
      // Storage blocked: still let them in for this page view.
    }
    document.documentElement.removeAttribute("data-terms");
  }

  return (
    <>
      <div id="terms-cover" aria-hidden />
      <div id="terms-gate" role="dialog" aria-modal="true" aria-labelledby="terms-title">
        <div className="m-auto w-full max-w-[520px] rounded-[28px] bg-surface p-6 shadow-[var(--shadow-lg)] sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <ShieldAlert className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <h2 id="terms-title" className="t-title mt-4">
            Before you continue
          </h2>
          <ul className="mt-3 flex flex-col gap-2.5 text-[15px] leading-snug text-ink-300">
            <li>
              <strong className="font-semibold text-ink-100">Information only.</strong> NEXUS shows market data, news,
              ratings and AI-written summaries. None of it is financial, investment, legal or tax advice.
            </li>
            <li>
              <strong className="font-semibold text-ink-100">Crypto is risky.</strong> Prices swing hard, new tokens are
              often scams, and you can lose everything you put in.
            </li>
            <li>
              <strong className="font-semibold text-ink-100">Data can be wrong or late.</strong> It comes from third
              parties. Ratings and AI answers are automated and can be mistaken.
            </li>
          </ul>

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl bg-surface-2 p-4">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[var(--accent)]"
            />
            <span className="text-[14px] leading-snug text-ink-200">
              I&apos;m at least 18, it&apos;s lawful for me to use this site where I live, and I have read and agree to
              the{" "}
              <Link href="/terms" target="_blank" className="font-medium text-accent">
                Terms of Use
              </Link>
              ,{" "}
              <Link href="/privacy" target="_blank" className="font-medium text-accent">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link href="/disclaimer" target="_blank" className="font-medium text-accent">
                Risk Disclaimer
              </Link>
              . I understand NEXUS does not give financial advice.
            </span>
          </label>

          <button
            onClick={accept}
            disabled={!checked}
            className="press mt-5 h-[50px] w-full rounded-[14px] bg-accent text-[16px] font-semibold text-white transition-opacity disabled:opacity-35"
          >
            Agree and continue
          </button>
        </div>
      </div>
    </>
  );
}
