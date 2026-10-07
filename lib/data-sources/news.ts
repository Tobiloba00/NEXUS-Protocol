/**
 * News headlines + "voices" (blogs, videos, podcasts from well-known people),
 * all read from the publishers' own public RSS/Atom feeds — free, no keys,
 * confirmed working during this build. We show the headline, the source and
 * the time, and link out; we never copy article text. Server-side only
 * (fetched with revalidation, so traffic never hits the publishers).
 *
 * Deliberately NOT here: live posts from X/Twitter. X now charges per post
 * read ($0.005 each), and Reddit/Bluesky block unauthenticated server reads,
 * so those can't be offered for free.
 */

export type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string; // ISO
};

export type Voice = {
  name: string;
  kind: "Blog" | "Video" | "Podcast" | "Research";
  blurb: string;
  site: string;
  feed: string;
};

const UA = "NexusProtocol/1.0 (+https://nexus-protocol-inky.vercel.app)";
const TTL_MS = 5 * 60_000;

/** Safety valve only: every feed we use is under ~550 KB (Next.js can cache up
 * to 2 MB per fetch), so anything bigger is treated as a misbehaving feed. */
const MAX_FEED_CHARS = 1_500_000;

// Warm-instance memo on top of Next's fetch cache — it keeps the Ask tool from
// re-reading feeds on every question.
const memo = new Map<string, { at: number; items: NewsItem[] }>();


export const NEWS_SOURCES: { name: string; feed: string }[] = [
  { name: "CoinDesk", feed: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { name: "Cointelegraph", feed: "https://cointelegraph.com/rss" },
  { name: "Decrypt", feed: "https://decrypt.co/feed" },
  { name: "The Block", feed: "https://www.theblock.co/rss.xml" },
  { name: "Bitcoin Magazine", feed: "https://bitcoinmagazine.com/.rss/full/" },
];

// Feeds confirmed to respond during this build. Left out: Paradigm, Messari and
// Galaxy (404) and the Unchained podcast (a 13 MB feed with no recent episode
// in its first 300 KB — not worth downloading).
export const VOICES: Voice[] = [
  { name: "Vitalik Buterin", kind: "Blog", blurb: "Co-founder of Ethereum", site: "https://vitalik.eth.limo", feed: "https://vitalik.eth.limo/feed.xml" },
  { name: "Bankless", kind: "Blog", blurb: "Ethereum & DeFi essays", site: "https://www.bankless.com", feed: "https://www.bankless.com/rss/feed" },
  { name: "a16z crypto", kind: "Research", blurb: "Venture firm's research & views", site: "https://a16zcrypto.com", feed: "https://a16zcrypto.com/feed/" },
  { name: "Glassnode Insights", kind: "Research", blurb: "On-chain market analysis", site: "https://insights.glassnode.com", feed: "https://insights.glassnode.com/rss/" },
  { name: "Coin Bureau", kind: "Video", blurb: "Explainers & market takes", site: "https://www.youtube.com/@CoinBureau", feed: "https://www.youtube.com/feeds/videos.xml?channel_id=UCqK_GSMbpiV8spgD3ZGloSw" },
  { name: "Bankless (YouTube)", kind: "Video", blurb: "Interviews & Ethereum news", site: "https://www.youtube.com/@Bankless", feed: "https://www.youtube.com/feeds/videos.xml?channel_id=UCAl9Ld79qaZxp9JzEOwd3aA" },
];

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", hellip: "…" };

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#([0-9]+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, name: string): string | undefined {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : undefined;
}

/** Handles RSS 2.0 (<item>) and Atom (<entry>, as YouTube uses). */
export function parseFeed(xml: string, source: string, limit = 20): NewsItem[] {
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) ?? [];
  const out: NewsItem[] = [];
  for (const block of blocks) {
    const title = tag(block, "title");
    let url = tag(block, "link")?.trim();
    if (!url || url.startsWith("<") || !/^https?:/i.test(decode(url))) {
      // Atom: <link rel="alternate" href="..."/>
      url = block.match(/<link[^>]*href="([^"]+)"[^>]*>/i)?.[1];
    }
    const date = tag(block, "pubDate") ?? tag(block, "published") ?? tag(block, "updated") ?? tag(block, "dc:date");
    if (!title || !url || !date) continue;
    const when = new Date(decode(date));
    if (Number.isNaN(when.getTime())) continue;
    const cleanUrl = decode(url);
    if (!/^https?:\/\//i.test(cleanUrl)) continue;
    out.push({ id: cleanUrl, title: decode(title), url: cleanUrl, source, publishedAt: when.toISOString() });
    if (out.length >= limit) break;
  }
  return out;
}

async function fetchFeed(source: string, feed: string, limit: number): Promise<NewsItem[]> {
  const hit = memo.get(feed);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.items.slice(0, limit);
  try {
    const res = await fetch(feed, {
      headers: { "user-agent": UA, accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" },
      // Cached by Next (shared across requests and revalidated every 10 minutes).
      // Do NOT use no-store here: inside an ISR page it opts the whole route out
      // of static rendering and the build bakes in empty data.
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.warn(`[news] ${source} ${res.status}`);
      return hit?.items.slice(0, limit) ?? [];
    }
    const items = parseFeed((await res.text()).slice(0, MAX_FEED_CHARS), source, 30);
    memo.set(feed, { at: Date.now(), items });
    return items.slice(0, limit);
  } catch (err) {
    console.warn(`[news] ${source} failed`, err);
    return [];
  }
}

/** Newest headlines across all outlets, de-duplicated by title. */
export async function fetchNews(limit = 40): Promise<NewsItem[]> {
  const lists = await Promise.all(NEWS_SOURCES.map((s) => fetchFeed(s.name, s.feed, 15)));
  const seen = new Set<string>();
  return lists
    .flat()
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .filter((n) => {
      const key = n.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

export type VoiceFeed = Voice & { items: NewsItem[] };

/** Latest few items from each curated voice; voices whose feed is down are omitted. */
export async function fetchVoices(perVoice = 3): Promise<VoiceFeed[]> {
  const feeds = await Promise.all(
    VOICES.map(async (v) => ({ ...v, items: (await fetchFeed(v.name, v.feed, perVoice)).slice(0, perVoice) }))
  );
  return feeds.filter((v) => v.items.length > 0);
}
