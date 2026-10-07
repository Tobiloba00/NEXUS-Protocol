import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { fetchNews, fetchVoices } from "@/lib/data-sources/news";
import { Page, PageHeader } from "@/components/layout/Page";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { AiInsightButton } from "@/components/ask/AiInsightButton";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Crypto News & Voices",
  description:
    "The day's top crypto headlines from CoinDesk, Cointelegraph, Decrypt, The Block and Bitcoin Magazine, plus the latest from well-known voices — Vitalik Buterin, Bankless, a16z crypto and more.",
};

export default async function NewsPage() {
  const [news, voices] = await Promise.all([fetchNews(30), fetchVoices(3)]);

  return (
    <Page
      aside={
        <>
          <section>
            <h2 className="t-title mb-3 px-1">Voices</h2>
            <div className="group-card" style={{ "--sep-inset": "16px" } as React.CSSProperties}>
              {voices.map((v) => (
                <div key={v.name} className="list-row px-4 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <a href={v.site} target="_blank" rel="noopener noreferrer" className="text-[15px] font-semibold tracking-[-0.01em] hover:text-accent">
                      {v.name}
                    </a>
                    <span className="rounded-full bg-surface-2 px-2 py-[2px] text-[11.5px] font-medium text-ink-300">{v.kind}</span>
                  </div>
                  <p className="text-[12.5px] text-ink-400">{v.blurb}</p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {v.items.map((it) => (
                      <li key={it.id}>
                        <a
                          href={it.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[13.5px] leading-snug text-ink-200 transition-colors hover:text-accent"
                        >
                          {it.title}
                          <RelativeTime iso={it.publishedAt} className="ml-1.5 text-[12px] text-ink-500" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {voices.length === 0 && <p className="px-4 py-8 text-center text-[14px] text-ink-400">Voices are unavailable right now.</p>}
            </div>
          </section>
          <p className="px-1 text-[12.5px] leading-snug text-ink-400">
            Voices are public figures&apos; and publishers&apos; own content. They may hold or promote the assets they discuss,
            and opinions aren&apos;t facts. Information only — not financial advice.
          </p>
        </>
      }
    >
      <PageHeader
        title="News"
        subtitle="Top crypto stories from the main outlets, newest first."
        trailing={<AiInsightButton label="Summarize" question="Summarize today's top crypto stories from the headlines, attributing each to its outlet, and note which market data (if any) relates to them." />}
      />

      <p className="-mt-4 rounded-2xl bg-surface px-4 py-3 text-[13.5px] leading-snug text-ink-300">
        <strong className="font-semibold text-ink-100">Headlines only, with credit.</strong> Stories belong to their
        publishers and open on their sites. NEXUS hasn&apos;t verified them, and rumours or &ldquo;insider&rdquo; stories are
        not facts. Information only — not financial advice.
      </p>

      <ul className="group-card" style={{ "--sep-inset": "16px" } as React.CSSProperties}>
        {news.map((n) => (
          <li key={n.id} className="list-row">
            <a href={n.url} target="_blank" rel="noopener noreferrer" className="list-row group flex items-start gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[12.5px] text-ink-400">
                  <span className="font-semibold text-ink-300">{n.source}</span>
                  <RelativeTime iso={n.publishedAt} />
                </div>
                <p className="mt-0.5 text-[16px] font-semibold leading-snug tracking-[-0.015em]">{n.title}</p>
              </div>
              <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-ink-500 transition-colors group-hover:text-accent" strokeWidth={2.2} />
            </a>
          </li>
        ))}
        {news.length === 0 && <li className="px-4 py-12 text-center text-[15px] text-ink-400">News is unavailable right now.</li>}
      </ul>
    </Page>
  );
}
