// AI-newsletter RSS feeds. Curated list. Each fetch is best-effort —
// individual feed timeouts/parse errors don't break the others.

import Parser from "rss-parser";
import type { NewsItem } from "../search.js";
import { logApiCall, logApiError } from "../log.js";

// Curated AI newsletter feeds. Add or remove freely.
const FEEDS: Array<{ name: string; url: string; weight: number }> = [
  { name: "Latent Space", url: "https://www.latent.space/feed", weight: 80 },
  { name: "One Useful Thing (Ethan Mollick)", url: "https://www.oneusefulthing.org/feed", weight: 80 },
  { name: "Last Week in AI", url: "https://lastweekin.ai/feed", weight: 70 },
  // Dropped 2026-05-18: "Ben's Bites" (bensbites.beehiiv.com/feed) and
  // "The Rundown AI" (therundown.ai/feed/rss) both return 403/dead —
  // were generating 26 error-log rows/day. Re-add if they republish.
  { name: "The Sequence", url: "https://thesequence.substack.com/feed", weight: 60 },
  { name: "Import AI (Jack Clark)", url: "https://importai.substack.com/feed", weight: 70 },
  { name: "Simon Willison", url: "https://simonwillison.net/atom/everything/", weight: 75 },
];

const parser = new Parser({ timeout: 8_000 });

async function fetchFeed(name: string, url: string, weight: number, sinceMs: number): Promise<NewsItem[]> {
  const feed = await parser.parseURL(url);
  return (feed.items ?? [])
    .filter((it) => {
      if (!it.title || !it.link) return false;
      if (!it.isoDate && !it.pubDate) return true; // accept if no date
      const d = new Date(it.isoDate ?? it.pubDate!).getTime();
      return d >= sinceMs;
    })
    .map((it) => {
      const snippet =
        (it.contentSnippet ?? it.summary ?? it.content ?? "").slice(0, 500) ||
        `From ${name}`;
      return {
        title: it.title!,
        url: it.link!,
        content: `${name}: ${snippet}`,
        score: weight,
        published_date: it.isoDate ?? it.pubDate ?? undefined,
      };
    });
}

export async function fetchAiRss(args: {
  days?: number;
  endpoint: string;
  userId?: string;
}): Promise<NewsItem[]> {
  const start = Date.now();
  const sinceMs = Date.now() - (args.days ?? 14) * 86400_000;

  const results = await Promise.allSettled(
    FEEDS.map((f) => fetchFeed(f.name, f.url, f.weight, sinceMs)),
  );

  const items: NewsItem[] = [];
  let okFeeds = 0;
  let failedFeeds = 0;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled") {
      items.push(...r.value);
      okFeeds++;
    } else {
      failedFeeds++;
      logApiError(
        { endpoint: args.endpoint, vendor: "rss", extra: { feed: FEEDS[i].name, url: FEEDS[i].url } },
        r.reason,
      );
    }
  }

  // Dedupe by URL, keep highest weight.
  const byUrl = new Map<string, NewsItem>();
  for (const it of items) {
    const e = byUrl.get(it.url);
    if (!e || (it.score ?? 0) > (e.score ?? 0)) byUrl.set(it.url, it);
  }
  const deduped = Array.from(byUrl.values());
  // Most recent first
  deduped.sort((a, b) => {
    const da = a.published_date ? new Date(a.published_date).getTime() : 0;
    const db = b.published_date ? new Date(b.published_date).getTime() : 0;
    return db - da;
  });

  logApiCall({
    endpoint: args.endpoint,
    vendor: "rss",
    stage: "ai_newsletters",
    userId: args.userId,
    latencyMs: Date.now() - start,
    extra: { feeds: FEEDS.length, okFeeds, failedFeeds, items: deduped.length },
  });
  return deduped;
}
