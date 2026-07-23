// Tavily search wrapper. Purpose-built for LLM agents — returns clean
// JSON of recent web results with title, URL, snippet, freshness score.
// Used to feed real, recent AI news into issue generation so the LLM
// curates instead of hallucinating.
//
// Pricing (2026): free tier 1000 credits/mo, then $0.008/search basic /
// $0.016 advanced. Topic "news" + days param indexes within hours.

import { logApiCall, logApiError } from "./log.js";

export type NewsItem = {
  title: string;
  url: string;
  content: string; // snippet, ~300-500 chars
  score: number;
  published_date?: string;
};

export async function searchNews(args: {
  query: string;
  days?: number;
  maxResults?: number;
  endpoint: string;
  userId?: string;
  // Restrict to specific domains, e.g. ["x.com","twitter.com"] for AI Twitter
  // chatter. Tavily's include_domains lets us turn a generic news query into
  // "what's the AI world tweeting about this week" without a separate vendor.
  includeDomains?: string[];
}): Promise<NewsItem[]> {
  const start = Date.now();
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    logApiCall({
      endpoint: args.endpoint,
      vendor: "tavily",
      stage: "skipped_no_api_key",
      userId: args.userId,
      latencyMs: Date.now() - start,
      extra: { query: args.query },
    });
    return [];
  }

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: args.query,
        topic: "news",
        days: args.days ?? 7,
        max_results: args.maxResults ?? 8,
        search_depth: "advanced",
        include_answer: false,
        include_raw_content: false,
        ...(args.includeDomains && args.includeDomains.length > 0
          ? { include_domains: args.includeDomains }
          : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      const err = new Error(`Tavily ${res.status}: ${body.slice(0, 300)}`);
      (err as Error & { status?: number }).status = res.status;
      throw err;
    }
    const data = (await res.json()) as { results?: NewsItem[] };
    const results = data.results ?? [];

    logApiCall({
      endpoint: args.endpoint,
      vendor: "tavily",
      stage: "news_search",
      userId: args.userId,
      latencyMs: Date.now() - start,
      extra: {
        query: args.query,
        days: args.days ?? 7,
        count: results.length,
        includeDomains: args.includeDomains ?? null,
      },
    });

    return results;
  } catch (e) {
    logApiError(
      { endpoint: args.endpoint, vendor: "tavily", stage: "news_search", userId: args.userId, extra: { query: args.query } },
      e,
    );
    return [];
  }
}
