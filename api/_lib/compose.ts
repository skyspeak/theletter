import {
  baseTemplateForWeek,
  greetName,
  type SubscriberPersona,
  type WeeklyIssueContent,
  weekOfYear,
} from './templates.js'

const cache = new Map<string, WeeklyIssueContent>()

function cacheKey(week: number, persona: SubscriberPersona): string {
  const role = (persona.role ?? '').toLowerCase().slice(0, 80)
  const focus = (persona.focusAreas ?? []).join(',').toLowerCase().slice(0, 120)
  return `${week}|${role}|${focus}`
}

async function personalizeWithGemini(
  base: WeeklyIssueContent,
  persona: SubscriberPersona,
): Promise<WeeklyIssueContent | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null

  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
  const prompt = `You personalize a weekly career/AI newsletter called "dear[CC] The Letter".
Return ONLY valid JSON matching this TypeScript type:
{ "headline": string, "intro": string, "sections": [{"title": string, "body": string}], "toolOfTheWeek": {"name": string, "blurb": string}, "actionItem": string }

Keep the same structure and roughly the same length as the base. Soften jargon. Address the reader's role/industry/focus when relevant. Do not invent statistics.

Reader:
- name: ${persona.name ?? 'n/a'}
- role: ${persona.role ?? 'n/a'}
- industry: ${persona.industry ?? 'n/a'}
- focusAreas: ${(persona.focusAreas ?? []).join('; ') || 'n/a'}

Base JSON:
${JSON.stringify(base)}`

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.6 },
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return null
    const parsed = JSON.parse(text) as WeeklyIssueContent
    if (!parsed.headline || !parsed.intro || !Array.isArray(parsed.sections)) return null
    return parsed
  } catch {
    return null
  }
}

export async function buildWeeklyIssueContent(
  persona: SubscriberPersona,
  when = new Date(),
): Promise<WeeklyIssueContent> {
  const base = baseTemplateForWeek(when)
  const week = weekOfYear(when)
  const key = cacheKey(week, persona)
  const hit = cache.get(key)
  if (hit) return hit

  const personalized = await personalizeWithGemini(base, persona)
  const content = personalized ?? base
  // Light local greeting tweak when Gemini skipped
  if (!personalized && persona.role) {
    content.intro = `${greetName(persona)}, for someone exploring ${persona.role}: ${content.intro}`
  }
  cache.set(key, content)
  return content
}
