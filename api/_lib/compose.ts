import { generateCuratedIssue } from './issue_gen.js'
import type { IssuePayload } from './prompts.js'
import {
  baseTemplateForWeek,
  greetName,
  type SubscriberPersona,
  type WeeklyIssueContent,
  weekOfYear,
} from './templates.js'

export type ComposeResult =
  | { mode: 'curated'; payload: IssuePayload }
  | { mode: 'template'; content: WeeklyIssueContent }

/**
 * Prefer StayRelevant-style curated generation (OpenRouter + source pools).
 * Falls back to rotating templates when OPENROUTER_API_KEY is unset or gen fails.
 */
export async function composeWeeklyIssue(
  persona: SubscriberPersona & {
    email: string
    company?: string | null
    seniority?: string | null
    technicalLevel?: string | null
    preferredTools?: string[]
    about?: string | null
    experienceSummary?: string | null
  },
  when = new Date(),
): Promise<ComposeResult> {
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const payload = await generateCuratedIssue({
        endpoint: '/api/cron/newsletter',
        userId: persona.email,
        profile: {
          email: persona.email,
          role: persona.role ?? null,
          company: persona.company ?? null,
          industry: persona.industry ?? null,
          focusAreas: persona.focusAreas ?? [],
          seniority: persona.seniority ?? null,
          technicalLevel: persona.technicalLevel ?? 'some',
          preferredTools: persona.preferredTools?.length
            ? persona.preferredTools
            : ['ChatGPT', 'Claude.ai'],
          wantBuildExercise: true,
          about: persona.about ?? null,
          experienceSummary: persona.experienceSummary ?? null,
        },
      })
      return { mode: 'curated', payload }
    } catch (e) {
      console.error('[compose] curated generation failed, falling back to template', e)
    }
  }

  const base = baseTemplateForWeek(when)
  const content = { ...base, sections: [...base.sections] }
  if (persona.role) {
    content.intro = `${greetName(persona)}, for someone exploring ${persona.role}: ${content.intro}`
  }
  void weekOfYear(when)
  return { mode: 'template', content }
}

/** @deprecated Prefer composeWeeklyIssue — kept for any residual callers. */
export async function buildWeeklyIssueContent(
  persona: SubscriberPersona,
  when = new Date(),
): Promise<WeeklyIssueContent> {
  const result = await composeWeeklyIssue(
    { ...persona, email: persona.name ?? 'reader@local' },
    when,
  )
  if (result.mode === 'template') return result.content
  // Flatten curated → legacy shape if something still expects WeeklyIssueContent
  const lead = result.payload.newsletterPicks[0]
  return {
    headline: lead?.title ?? result.payload.news.title,
    intro: lead?.whyRelevant ?? result.payload.news.whyRelevant,
    sections: [
      {
        title: 'Big AI news',
        body: `${result.payload.news.title}: ${result.payload.news.takeaway}`,
      },
      ...result.payload.forYourRole.slice(0, 2).map((a) => ({
        title: a.title,
        body: a.takeaway,
      })),
    ],
    toolOfTheWeek: {
      name: result.payload.buildExercise.tools[0] ?? 'Build this week',
      blurb: result.payload.buildExercise.pitch,
    },
    actionItem: result.payload.buildExercise.title,
  }
}
