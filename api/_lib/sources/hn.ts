// Hacker News — via Algolia HN search API. Free, no key.
// Pulls AI-related front-page items from the last N days, sorted by points.

import type { NewsItem } from "../search.js";
import { logApiCall, logApiError } from "../log.js";

const ENDPOINT = "https://hn.algolia.com/api/v1/search_by_date";

type AlgoliaHit = {
  title?: string;
  story_title?: string;
  url?: string;
  story_url?: string;
  points?: number;
  num_comments?: number;
  created_at?: string;
  objectID?: string;
};

export async function fetchHnAi(args: {
  days?: number;
  minPoints?: number;
  endpoint: string;
  userId?: string;
}): Promise<NewsItem[]> {
  const start = Date.now();
  const days = args.days ?? 14;
  const minPoints = args.minPoints ?? 50;
  const since = Math.floor((Date.now() - days * 86400_000) / 1000);
  const url = `${ENDPOINT}?tags=story&numericFilters=created_at_i>${since},points>${minPoints}&query=${encodeURIComponent("AI OR LLM OR agent OR Claude OR GPT OR Anthropic OR OpenAI")}&hitsPerPage=20`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) throw new Error(`HN ${res.status}`);
    const data = (await res.json()) as { hits?: AlgoliaHit[] };
    const hits = data.hits ?? [];

    const items: NewsItem[] = hits
      .filter((h) => (h.story_url ?? h.url) && (h.story_title ?? h.title))
      .map((h) => {
        const link = (h.story_url ?? h.url) as string;
        const title = (h.story_title ?? h.title) as string;
        const points = h.points ?? 0;
        const comments = h.num_comments ?? 0;
        const hnUrl = h.objectID ? `https://news.ycombinator.com/item?id=${h.objectID}` : link;
        return {
          title,
          url: link,
          content: `Hacker News · ${points} points · ${comments} comments. Discussion: ${hnUrl}`,
          score: points,
          published_date: h.created_at,
        };
      });

    logApiCall({
      endpoint: args.endpoint,
      vendor: "hn_algolia",
      stage: "ai_search",
      userId: args.userId,
      latencyMs: Date.now() - start,
      extra: { days, minPoints, count: items.length },
    });
    return items;
  } catch (e) {
    logApiError({ endpoint: args.endpoint, vendor: "hn_algolia", userId: args.userId }, e);
    return []; // fail open — issue gen continues with other sources
  }
}
