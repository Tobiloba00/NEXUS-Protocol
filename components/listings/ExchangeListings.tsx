import { RelativeTime } from "@/components/ui/RelativeTime";
import type { ExchangeListing } from "@/lib/data-sources/exchange-listings";

const KIND_STYLE: Record<ExchangeListing["kind"], string> = {
  "Spot listing": "bg-pos-soft text-pos",
  Futures: "bg-accent-soft text-accent",
  Other: "bg-surface-2 text-ink-300",
};

/** Coins that centralized exchanges have just announced. The ticker badge is
 * "what it lists as". Each row links to the exchange's own announcement. */
export function ExchangeListings({ listings }: { listings: ExchangeListing[] }) {
  if (listings.length === 0) {
    return (
      <p className="group-card px-5 py-12 text-center text-[15px] text-ink-400">
        Exchange announcements are unavailable right now. Please check back soon.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <ul className="group-card" style={{ "--sep-inset": "16px" } as React.CSSProperties}>
        {listings.map((l) => (
          <li key={l.id} className="list-row">
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="list-row flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-full px-2 py-[2px] text-[11.5px] font-semibold ${KIND_STYLE[l.kind]}`}>{l.kind}</span>
                  {l.tickers.map((t) => (
                    <span key={t} className="rounded-md bg-surface-2 px-1.5 py-[2px] text-[12.5px] font-semibold tabular-nums tracking-wide">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-[15px] font-medium leading-snug tracking-[-0.01em]">{l.title}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-[13px] text-ink-400">
                <span>{l.exchange}</span>
                <RelativeTime iso={l.publishedAt} />
              </div>
            </a>
          </li>
        ))}
      </ul>
      <p className="px-1 text-[12.5px] leading-snug text-ink-400">
        Announcements are from the exchange&apos;s own site. A listing announcement is not a recommendation, and prices
        often swing sharply around listings.
      </p>
    </div>
  );
}
