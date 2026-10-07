import Link from "next/link";

/** Every page ends with the same plain-language caution and the legal links.
 * Also carries the data-source attribution CoinGecko's free plan requires. */
export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4 px-5 py-8 text-[13px] leading-relaxed text-ink-400 sm:px-8">
        <p>
          <strong className="font-semibold text-ink-300">Information only — not financial advice.</strong> NEXUS shows market
          data, news, risk ratings and AI-written summaries for general information. Crypto assets are volatile and high
          risk; new tokens are frequently scams. Do your own research and never invest more than you can afford to lose.
        </p>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-1.5 font-medium">
          <Link href="/terms" className="hover:text-ink-100">Terms of Use</Link>
          <Link href="/privacy" className="hover:text-ink-100">Privacy</Link>
          <Link href="/disclaimer" className="hover:text-ink-100">Risk Disclaimer</Link>
        </nav>
        <p className="text-[12px]">
          Data from{" "}
          <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="hover:text-ink-100">
            CoinGecko
          </a>
          , Binance, DexScreener, Polymarket, Magic Eden and GoPlus. Headlines belong to their publishers. Some figures are
          delayed or approximate.
        </p>
      </div>
    </footer>
  );
}
