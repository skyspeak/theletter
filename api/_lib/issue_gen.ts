import { chatJson } from './llm.js'
import { searchNews, type NewsItem } from './search.js'
import { fetchHnAi } from './sources/hn.js'
import { fetchRedditAi } from './sources/reddit.js'
import { fetchAiRss } from './sources/rss.js'
import {
  issueSystemPrompt,
  issueUserPrompt,
  type IssuePayload,
  type IssueProfile,
} from './prompts.js'
import { findBannedPhrases, sanitizeIssue } from './sanitize.js'
import { logApiCall, logApiError } from './log.js'

export type GenerateIssueArgs = {
  profile: IssueProfile
  endpoint: string
  userId?: string
}

export async function generateCuratedIssue(
  args: GenerateIssueArgs,
): Promise<IssuePayload> {
  const start = Date.now()
  const { profile, endpoint } = args
  const userId = args.userId ?? profile.email
  const weekOf = new Date()

  const role = profile.role ?? 'professional'
  const industry = profile.industry ?? ''
  const focus = profile.focusAreas.slice(0, 3).join(' ')

  const howToQuery = [
    `AI tactics how to use AI ${role}`,
    industry ? `for ${industry}` : '',
    focus ? `${focus}` : '',
    'tips workflows tools playbook',
  ]
    .filter(Boolean)
    .join(' ')

  const buildQuery = [
    'Claude Code Cursor agentic AI build tutorial how to',
    role ? `for ${role}` : '',
    industry ? `in ${industry}` : '',
    'v0 Cline Aider Replit Agents recipes',
  ]
    .filter(Boolean)
    .join(' ')

  const [xTweets, xBroad, domainHowTos, buildHowTos, hnItems, redditItems, rssItems] =
    await Promise.all([
      searchNews({
        query: 'OpenAI Anthropic Google DeepMind Meta AI announcement launch model release',
        days: 7,
        maxResults: 6,
        includeDomains: ['twitter.com'],
        endpoint,
        userId,
      }),
      searchNews({
        query: 'OpenAI Anthropic Google DeepMind Meta major AI launch release this week',
        days: 7,
        maxResults: 6,
        endpoint,
        userId,
      }),
      searchNews({
        query: howToQuery,
        days: 30,
        maxResults: 10,
        endpoint,
        userId,
      }),
      searchNews({
        query: buildQuery,
        days: 60,
        maxResults: 8,
        endpoint,
        userId,
      }),
      fetchHnAi({ days: 10, minPoints: 50, endpoint, userId }),
      fetchRedditAi({ endpoint, userId }),
      fetchAiRss({ days: 14, endpoint, userId }),
    ])

  const newsletterPool = mergeAndCap([
    { items: rssItems, cap: 12 },
    { items: hnItems, cap: 6 },
    { items: redditItems, cap: 6 },
  ])

  const xNewsPool = mergeAndCap([
    { items: xTweets, cap: 6 },
    { items: xBroad, cap: 6 },
  ])

  logApiCall({
    endpoint,
    vendor: 'internal',
    stage: 'source_pool_assembled',
    userId,
    latencyMs: Date.now() - start,
    extra: {
      newsletterAfterMerge: newsletterPool.length,
      xNewsAfterMerge: xNewsPool.length,
      domain: domainHowTos.length,
      build: buildHowTos.length,
    },
  })

  if (
    newsletterPool.length === 0 &&
    xNewsPool.length === 0 &&
    domainHowTos.length === 0 &&
    buildHowTos.length === 0
  ) {
    throw new Error('all sources returned no results — every fetch failed?')
  }

  let payload: IssuePayload
  try {
    payload = await chatJson<IssuePayload>({
      system: issueSystemPrompt(),
      user: issueUserPrompt(
        profile,
        weekOf,
        newsletterPool,
        xNewsPool,
        domainHowTos,
        buildHowTos,
      ),
      maxTokens: 7000,
      temperature: 0.4,
    })
  } catch (e) {
    logApiError({ endpoint, userId, vendor: 'openrouter' }, e)
    throw e
  }

  const bannedHits = findBannedPhrases(payload)
  payload = sanitizeIssue(payload)
  if (bannedHits.length) {
    logApiCall({
      endpoint,
      vendor: 'internal',
      stage: 'banned_phrases_sanitized',
      userId,
      latencyMs: 0,
      extra: { hits: bannedHits },
    })
  }

  assertValidPayload(payload)

  logApiCall({
    endpoint,
    vendor: 'openrouter',
    stage: 'issue_generated',
    userId,
    latencyMs: Date.now() - start,
  })

  return payload
}

function assertValidPayload(payload: IssuePayload): void {
  const articleOk = (a: { title?: unknown; sourceUrl?: unknown; summary?: unknown }) =>
    Boolean(a?.title && a?.sourceUrl && Array.isArray(a?.summary) && a.summary.length >= 2)

  if (
    !Array.isArray(payload?.newsletterPicks) ||
    payload.newsletterPicks.length !== 2 ||
    !payload.newsletterPicks.every(articleOk) ||
    !articleOk(payload.news) ||
    !Array.isArray(payload.forYourRole) ||
    payload.forYourRole.length !== 3 ||
    !payload.forYourRole.every(articleOk) ||
    !payload.buildExercise?.title ||
    !Array.isArray(payload.buildExercise.steps) ||
    payload.buildExercise.steps.length < 3 ||
    !payload.quiz?.questions ||
    payload.quiz.questions.length !== 3
  ) {
    throw new Error('LLM returned malformed issue payload')
  }
}

function mergeAndCap(sources: Array<{ items: NewsItem[]; cap: number }>): NewsItem[] {
  const byUrl = new Map<string, NewsItem>()
  for (const { items, cap } of sources) {
    for (const it of items.slice(0, cap)) {
      const existing = byUrl.get(it.url)
      if (!existing || (it.score ?? 0) > (existing.score ?? 0)) {
        byUrl.set(it.url, it)
      }
    }
  }
  return Array.from(byUrl.values())
}
