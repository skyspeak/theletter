import type { ParsedJob } from './parse_job.js'
import type {
  LaborContext,
  PlanAnalysis,
  PlanRoadmap,
  RoadmapMilestone,
  SkillBar,
} from './plan_types.js'

export type AnalyzePersona = {
  name?: string | null
  role?: string | null
  industry?: string | null
  focusAreas?: string[] | null
  focusNote?: string | null
  linkedinUrl?: string | null
}

function firstNameFrom(persona: AnalyzePersona, email: string): string {
  if (persona.name?.trim()) {
    return persona.name.trim().split(/\s+/)[0] ?? 'You'
  }
  const local = email.split('@')[0] ?? 'you'
  const cleaned = local.replace(/[._-]+/g, ' ').trim()
  if (!cleaned) return 'You'
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).split(' ')[0]
}

function targetRole(job: ParsedJob, persona: AnalyzePersona, labor: LaborContext | null): string {
  if (job.title) return job.title
  if (labor?.title) return labor.title
  if (persona.role) return persona.role.replace(/^Student exploring\s+/i, '')
  return 'your target role'
}

function clampWidth(n: number): number {
  return Math.max(18, Math.min(92, Math.round(n)))
}

function buildFallbackAnalysis(
  email: string,
  job: ParsedJob,
  persona: AnalyzePersona,
  labor: LaborContext | null,
): PlanAnalysis {
  const name = firstNameFrom(persona, email)
  const role = targetRole(job, persona, labor)
  const company = job.subject
  const aiHigh =
    (labor?.karpathyExposure != null && labor.karpathyExposure >= 0.55) ||
    labor?.aiDisruptionLabel === 'High' ||
    labor?.aiDisruptionLabel === 'Very High'
  const competitive =
    labor?.competitionLevel === 'High' || labor?.competitionLevel === 'Very High'

  const strengths: SkillBar[] = [
    {
      title: persona.industry
        ? `Domain context in ${persona.industry}`
        : 'Career exploration habits',
      status: 'Strong',
      tone: 'green',
      width: clampWidth(68),
      chips: (persona.focusAreas ?? []).slice(0, 2).length
        ? (persona.focusAreas ?? []).slice(0, 2)
        : ['research', 'self-directed learning'],
    },
    {
      title: 'Communication and framing',
      status: 'Solid',
      tone: 'green',
      width: clampWidth(58),
      chips: ['storytelling', 'written clarity'],
    },
  ]

  const gaps: SkillBar[] = [
    {
      title: `Role-specific proof for ${role}`,
      status: competitive ? 'Priority gap' : 'Still developing',
      tone: competitive ? 'red' : 'amber',
      width: clampWidth(competitive ? 28 : 40),
      chips: ['portfolio proof', 'role keywords'],
    },
    {
      title: aiHigh ? 'AI fluency for this occupation' : 'Target-company fluency',
      status: aiHigh ? 'Building up' : 'Still developing',
      tone: aiHigh ? 'amber' : 'red',
      width: clampWidth(aiHigh ? 45 : 34),
      chips: aiHigh ? ['prompt workflows', 'AI-assisted delivery'] : ['company research', 'outreach'],
    },
  ]

  const roleSuggestions = labor
    ? [
        {
          title: labor.title,
          desc: `Closest BLS match — ${labor.competitionLevel ?? 'n/a'} competition.`,
          match: 86,
          highlight: true,
        },
        {
          title: `Adjacent path to ${role}`,
          desc: 'A stepping-stone role with overlapping skills.',
          match: 72,
        },
        {
          title: `${persona.industry ?? 'Generalist'} specialist`,
          desc: 'Lean on domain strengths while you close role gaps.',
          match: 64,
        },
      ]
    : [
        {
          title: role,
          desc: `Direct shot at ${company}.`,
          match: 70,
          highlight: true,
        },
        {
          title: 'Analyst / coordinator bridge',
          desc: 'Often an easier entry with transferable skills.',
          match: 62,
        },
        {
          title: 'Growth / ops hybrid',
          desc: 'Smaller credential gap than a pure specialist seat.',
          match: 55,
        },
      ]

  const summary = labor
    ? `Matched your profile toward ${role} at ${company}, using ${labor.title} (${labor.soc}) labor-market context.`
    : `Mapped your profile against ${role} · ${company}.`

  return {
    firstName: name,
    targetRole: role,
    targetCompany: company,
    strengths,
    gaps,
    roleSuggestions,
    laborContext: labor,
    summary,
  }
}

function buildFallbackRoadmap(analysis: PlanAnalysis): PlanRoadmap {
  const { targetRole, targetCompany, firstName } = analysis
  const milestones: RoadmapMilestone[] = [
    {
      id: 'M1',
      title: 'LinkedIn',
      summary: `Rewrite your headline and about section to speak directly to ${targetRole} roles.`,
      badge: 'Start here',
      tone: 'primary',
      bullets: [
        `Headline: lead with the role you want — e.g. “Aspiring ${targetRole} · building in public”.`,
        'About: open with a 2-line story that connects your background to outcomes, not job titles.',
        `Add 3 role keywords so recruiters surface your profile for ${targetRole}.`,
      ],
    },
    {
      id: 'M2',
      title: 'Outreach template',
      summary: `A cold outreach draft aimed at ${targetRole} conversations — ready to adapt.`,
      tone: 'neutral',
      copyBlock: `Hi [Name],

I came across ${targetCompany}'s work and it lined up with what I've been building toward as a ${targetRole}.

Over the last few years I've [1-line background], and I'm now focused on ${targetRole} roles.

Would you be open to a 15-minute chat about how your team approaches [relevant problem]? Happy to work around your schedule.

Thanks,
${firstName}`,
    },
    {
      id: 'M3',
      title: 'Interview prep',
      summary: `Practice questions tailored to ${targetRole} interviews${targetCompany !== 'your job description' ? ` at ${targetCompany}` : ''}.`,
      tone: 'neutral',
      bullets: [
        `Product / craft: “How would you improve a core workflow for first-time users at a company like ${targetCompany}?”`,
        'Analytical: “A key metric dropped 3% last week — how do you find the cause?”',
        'Behavioral: “Tell me about a time you shipped with incomplete data. What did you decide?”',
      ],
    },
    {
      id: 'M4',
      title: 'Project ideas to pitch',
      summary: 'Three small projects you could ship this month to close the gap — with outreach copy.',
      badge: 'New',
      tone: 'success',
      copyBlock: `Idea 1 — Local service business: one-page workflow redesign
Draft a short brief and mock the core screen.

Idea 2 — Retention dashboard
Spec a simple view showing at-risk users and win-back triggers.

Idea 3 — Conversion audit
Walk an existing signup/order path and propose 3 concrete fixes.

--- Outreach ---

Hi [Owner name],

I'm working on ${targetRole}-style projects with local teams. I put together a short concept for [business] and would love 15 minutes to walk you through it.

Could I stop by this week?

Best,
${firstName}`,
    },
  ]

  return {
    eyebrow: `${targetRole} · ${targetCompany}`,
    milestones,
  }
}

async function personalizeWithGemini(
  baseAnalysis: PlanAnalysis,
  baseRoadmap: PlanRoadmap,
  persona: AnalyzePersona,
  job: ParsedJob,
): Promise<{ analysis: PlanAnalysis; roadmap: PlanRoadmap } | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null

  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
  const prompt = `You personalize a career "Game Plan" for dear[CC].
Return ONLY valid JSON matching:
{
  "analysis": {
    "firstName": string,
    "targetRole": string,
    "targetCompany": string,
    "summary": string,
    "strengths": [{"title": string, "status": string, "tone": "green"|"amber"|"red", "width": number, "chips": string[]}],
    "gaps": [{"title": string, "status": string, "tone": "green"|"amber"|"red", "width": number, "chips": string[]}],
    "roleSuggestions": [{"title": string, "desc": string, "match": number, "highlight"?: boolean}]
  },
  "roadmap": {
    "eyebrow": string,
    "milestones": [{"id": string, "title": string, "summary": string, "badge"?: string, "tone": "primary"|"neutral"|"success", "bullets"?: string[], "copyBlock"?: string}]
  }
}
Keep 2 strengths, 2 gaps, 3 roleSuggestions, 4 milestones (M1–M4). width is 18–92. Do not invent statistics; use laborContext if present. Soften jargon.

Reader:
- name: ${persona.name ?? 'n/a'}
- role: ${persona.role ?? 'n/a'}
- industry: ${persona.industry ?? 'n/a'}
- focusAreas: ${(persona.focusAreas ?? []).join('; ') || 'n/a'}
- focusNote: ${persona.focusNote ?? 'n/a'}
- linkedinUrl: ${persona.linkedinUrl ?? 'n/a'}
- jobDetail: ${job.detail}
- jobSubject: ${job.subject}

Base analysis JSON:
${JSON.stringify({ ...baseAnalysis, laborContext: baseAnalysis.laborContext })}
Base roadmap JSON:
${JSON.stringify(baseRoadmap)}`

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.55 },
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return null
    const parsed = JSON.parse(text) as {
      analysis?: PlanAnalysis
      roadmap?: PlanRoadmap
    }
    if (!parsed.analysis?.strengths || !parsed.roadmap?.milestones) return null
    return {
      analysis: {
        ...parsed.analysis,
        laborContext: baseAnalysis.laborContext,
      },
      roadmap: parsed.roadmap,
    }
  } catch {
    return null
  }
}

export async function buildGamePlanContent(args: {
  email: string
  job: ParsedJob
  persona: AnalyzePersona
  labor: LaborContext | null
}): Promise<{ analysis: PlanAnalysis; roadmap: PlanRoadmap }> {
  const analysis = buildFallbackAnalysis(args.email, args.job, args.persona, args.labor)
  const roadmap = buildFallbackRoadmap(analysis)
  const personalized = await personalizeWithGemini(analysis, roadmap, args.persona, args.job)
  return personalized ?? { analysis, roadmap }
}
