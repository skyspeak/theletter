// Reddit — via app-only ("userless") OAuth.
//
// 2026-05-18: switched off the public www.reddit.com/*.json endpoints —
// Reddit blocks unauthenticated requests from datacenter IP ranges, so
// every fetch from Vercel 403'd ("all subreddit fetches failed" ×13/day).
//
// App-only OAuth (client_credentials grant) works from datacenter IPs.
// Setup: register a "web app" at reddit.com/prefs/apps, set:
//   REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET
// If those env vars are absent, this source degrades gracefully to an
// empty result — it NEVER throws, because issue_gen.ts fans sources out
// with Promise.all and a rejection there would fail the whole generation.

import type { NewsItem } from "../search.js";
import { logApiCall, logApiError } from "../log.js";

const SUBS = [
  "MachineLearning",
  "LocalLLaMA",
  "OpenAI",
  "ChatGPTCoding",
  "singularity",
  "ArtificialInteligence",
];

// Reddit requires a descriptive, unique User-Agent or it rate-limits hard.
const UA = "web:theletter:0.1 (by /u/dearcc)";

const TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const API_BASE = "https://oauth.reddit.com";

// Module-level token cache — reused across warm invocations. Tokens last
// ~1h; we refresh ~5 min early.
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getRedditToken(): Promise<string | null> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "User-Agent": UA,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Reddit token ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("Reddit token response missing access_token");

  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + ((json.expires_in ?? 3600) - 300) * 1000,
  };
  return cachedToken.token;
}

type RedditPost = {
  data: {
    title: string;
    url: string;
    permalink: string;
    score: number;
    num_comments: number;
    created_utc: number;
    selftext?: string;
    subreddit: string;
    over_18?: boolean;
    stickied?: boolean;
    is_self?: boolean;
  };
};

type RedditListing = {
  data: { children: RedditPost[] };
};

async function fetchSub(sub: string, token: string): Promise<NewsItem[]> {
  const url = `${API_BASE}/r/${sub}/top?t=week&limit=15`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": UA,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`Reddit ${sub} ${res.status}`);
  const json = (await res.json()) as RedditListing;
  const posts = json.data?.children ?? [];

  return posts
    .filter((p) => !p.data.over_18 && !p.data.stickied && p.data.score >= 30)
    .map((p) => {
      const d = p.data;
      const isLink = !d.is_self && d.url && !d.url.includes("reddit.com");
      const link = isLink ? d.url : `https://www.reddit.com${d.permalink}`;
      const snippet = d.selftext
        ? `r/${d.subreddit} · ${d.score} upvotes · ${d.num_comments} comments. ${d.selftext.slice(0, 400)}`
        : `r/${d.subreddit} · ${d.score} upvotes · ${d.num_comments} comments. Discussion: https://www.reddit.com${d.permalink}`;
      return {
        title: d.title,
        url: link,
        content: snippet,
        score: d.score,
        published_date: new Date(d.created_utc * 1000).toISOString(),
      };
    });
}

export async function fetchRedditAi(args: {
  endpoint: string;
  userId?: string;
}): Promise<NewsItem[]> {
  const start = Date.now();

  // Resolve the OAuth token first. If creds aren't configured or the
  // token fetch fails, degrade to empty — never throw (Promise.all caller).
  let token: string | null;
  try {
    token = await getRedditToken();
  } catch (e) {
    await logApiError(
      { endpoint: args.endpoint, vendor: "reddit", stage: "oauth_token", userId: args.userId },
      e,
    );
    return [];
  }
  if (!token) {
    logApiCall({
      endpoint: args.endpoint,
      vendor: "reddit",
      stage: "skipped_no_credentials",
      userId: args.userId,
      latencyMs: Date.now() - start,
      extra: { reason: "REDDIT_CLIENT_ID/SECRET not configured" },
    });
    return [];
  }

  const results = await Promise.allSettled(SUBS.map((s) => fetchSub(s, token!)));
  const items: NewsItem[] = [];
  let okSubs = 0;
  let failedSubs = 0;
  for (const r of results) {
    if (r.status === "fulfilled") {
      items.push(...r.value);
      okSubs++;
    } else {
      failedSubs++;
    }
  }

  // Dedupe by URL, keep highest-score copy.
  const byUrl = new Map<string, NewsItem>();
  for (const it of items) {
    const existing = byUrl.get(it.url);
    if (!existing || (it.score ?? 0) > (existing.score ?? 0)) {
      byUrl.set(it.url, it);
    }
  }
  const deduped = Array.from(byUrl.values()).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  logApiCall({
    endpoint: args.endpoint,
    vendor: "reddit",
    stage: "subreddit_top_week",
    userId: args.userId,
    latencyMs: Date.now() - start,
    extra: { subs: SUBS.length, okSubs, failedSubs, items: deduped.length },
  });

  if (failedSubs > 0 && okSubs === 0) {
    await logApiError(
      { endpoint: args.endpoint, vendor: "reddit", extra: { failedSubs } },
      new Error("all subreddit fetches failed"),
    );
  }
  return deduped;
}
