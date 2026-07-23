export type WeeklyIssueContent = {
  headline: string
  intro: string
  sections: Array<{ title: string; body: string }>
  toolOfTheWeek: { name: string; blurb: string }
  actionItem: string
}

export type SubscriberPersona = {
  name?: string | null
  role?: string | null
  industry?: string | null
  focusAreas?: string[]
}

const TEMPLATES: WeeklyIssueContent[] = [
  {
    headline: 'AI is rewriting the job description — not just the resume',
    intro:
      'This week: how models show up in real workflows, what wages and openings still signal, and one small build that keeps you current.',
    sections: [
      {
        title: 'Signal from the field',
        body: 'Teams that treat AI as a draft partner (not an oracle) are shipping faster without handing over judgment. Watch for roles that pair domain taste with tool fluency.',
      },
      {
        title: 'Labor-market lens',
        body: 'Entry wages and openings still matter — but competition spikes where AI compresses junior work. Map your major to occupations that keep human review in the loop.',
      },
      {
        title: 'What to ignore',
        body: 'Hype about “full replacement” this quarter. The useful question is which tasks get automated first in your target occupation.',
      },
    ],
    toolOfTheWeek: {
      name: 'NotebookLM',
      blurb: 'Drop three course PDFs or job descriptions and ask for a comparison matrix — great for major → career research.',
    },
    actionItem:
      'Pick one occupation from Field Report this week and write a 5-bullet “AI-proof / AI-augmented” split for its daily tasks.',
  },
  {
    headline: 'The new literacy is knowing what to verify',
    intro:
      'Models draft confidently. Your edge is checking sources, wages, and whether a tool actually fits your role.',
    sections: [
      {
        title: 'Verification habit',
        body: 'For every AI summary of a career path, open the BLS line item yourself. Numbers beat vibes when you are choosing a major or a first job.',
      },
      {
        title: 'Interview tell',
        body: 'Hiring managers increasingly ask how you used AI on a real assignment — and how you caught its mistakes. Prepare one concrete story.',
      },
      {
        title: 'Campus → career',
        body: 'Internships that let you ship with AI tooling (research memos, data cleaning, customer ops) compound faster than generic “AI certificates.”',
      },
    ],
    toolOfTheWeek: {
      name: 'Claude Projects',
      blurb: 'Keep a project with your major notes + Field Report exports so weekly questions stay grounded in your path.',
    },
    actionItem:
      'Take one Field Report salary figure and find the OEWS table it came from. Screenshot it for your notes.',
  },
  {
    headline: 'Build small, ship weekly',
    intro:
      'You do not need a startup. You need a repeatable 30-minute build that teaches tools employers already use.',
    sections: [
      {
        title: 'Micro-builds that count',
        body: 'Automate a spreadsheet, summarize five papers, or draft a cover letter template with clear human edits. Put it in a portfolio folder.',
      },
      {
        title: 'Exposure ≠ destiny',
        body: 'High AI-exposure occupations still hire — they hire people who can direct the tools. Pair exposure scores with openings, not fear alone.',
      },
      {
        title: 'Network prompt',
        body: 'Ask one alum: “What part of your week did AI change in the last six months?” Collect answers like lab data.',
      },
    ],
    toolOfTheWeek: {
      name: 'Cursor',
      blurb: 'Even non-CS majors can prototype a tiny script (CSV cleanup, API pull). One working repo beats ten tutorials.',
    },
    actionItem:
      'Ship a 30-minute automation this week and write three sentences on what broke and how you fixed it.',
  },
  {
    headline: 'Majors still matter — the packaging changed',
    intro:
      'CIP codes and SOC titles are how the labor market talks. Learn that language and AI becomes a research assistant, not a replacement advisor.',
    sections: [
      {
        title: 'Translate your major',
        body: 'Use Field Report to name 2–3 primary occupations. That vocabulary unlocks better LinkedIn searches and better prompts.',
      },
      {
        title: 'State variance',
        body: 'The same SOC can mean very different wages by state. If you are mobile, map before you commit.',
      },
      {
        title: 'Narrative control',
        body: 'Your cover letter should say how you use AI on domain work — not that you “know ChatGPT.”',
      },
    ],
    toolOfTheWeek: {
      name: 'Perplexity',
      blurb: 'Ask for “BLS OEWS [occupation] median wage” and click through to the primary source every time.',
    },
    actionItem:
      'Export or screenshot your Field Report results page and annotate two occupations you would actually pursue.',
  },
  {
    headline: 'Competition is a ratio, not a vibe',
    intro:
      'Graduates per opening tells you where queues form. Combine it with AI exposure to see which funnels are both crowded and automating.',
    sections: [
      {
        title: 'Read the ratio',
        body: 'High competition + high AI exposure is a warning. High openings + moderate exposure is often a better bet for early careers.',
      },
      {
        title: 'Skills arbitrage',
        body: 'Adjacent occupations (related SOC codes) sometimes have better ratios. Field Report’s related table is for that hunt.',
      },
      {
        title: 'Portfolio signal',
        body: 'One public artifact that uses AI on your domain beats vague claims of “AI literacy” on a resume.',
      },
    ],
    toolOfTheWeek: {
      name: 'Gamma',
      blurb: 'Turn your Field Report notes into a tight 5-slide “path options” deck for advising meetings.',
    },
    actionItem:
      'Compare competition + AI risk for your top two occupations and pick a primary / backup path.',
  },
  {
    headline: 'Stay human where it counts',
    intro:
      'Judgment, taste, stakeholder trust, and physical presence still concentrate value. Design your week around those.',
    sections: [
      {
        title: 'Human bottlenecks',
        body: 'Client conversations, clinical judgment, teaching presence, design critique — protect practice time for these.',
      },
      {
        title: 'Automate the dull middle',
        body: 'First drafts, formatting, literature sweeps, and meeting notes are fair game for models. Keep the decision rights.',
      },
      {
        title: 'Weekly cadence',
        body: 'Fifteen minutes on Sunday is enough if it is specific: one signal, one number, one build.',
      },
    ],
    toolOfTheWeek: {
      name: 'Otter / Fireflies',
      blurb: 'Capture advising or informational interviews, then extract action items — practice supervising AI output.',
    },
    actionItem:
      'Block 15 minutes next Sunday to re-read this letter and update your Field Report shortlist.',
  },
]

export function weekOfYear(d = new Date()): number {
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const day = Math.floor((d.getTime() - start.getTime()) / 86400000)
  return Math.floor((day + start.getUTCDay()) / 7)
}

export function baseTemplateForWeek(d = new Date()): WeeklyIssueContent {
  const idx = weekOfYear(d) % TEMPLATES.length
  return structuredClone(TEMPLATES[idx]!)
}

export function greetName(persona: SubscriberPersona): string {
  const n = persona.name?.trim()
  if (n) return n.split(/\s+/)[0] ?? n
  return 'there'
}
