import { baseUrl, escapeHtml, fieldReportUrl, safeHttpUrl, shortHost } from './html.js'
import type { CuratedArticle, IssuePayload } from './prompts.js'
import type { WeeklyIssueContent } from './templates.js'

function gamePlanUrl(token: string): string {
  return `${baseUrl()}/plan?from=letter&t=${encodeURIComponent(token)}`
}

function brandHeader(): string {
  return `<div style="font-family:Fraunces,Georgia,'Times New Roman',serif;font-size:22px;font-weight:500;margin-bottom:4px">
      dear<span style="color:#d4552f">[</span><span style="color:#d4552f">CC</span><span style="color:#d4552f">]</span> The Letter
    </div>`
}

export function buildWelcomeEmail(args: {
  email: string
  role?: string | null
  unsubscribeToken: string
}): { subject: string; html: string; text: string } {
  const unsub = `${baseUrl()}/api/unsubscribe?t=${encodeURIComponent(args.unsubscribeToken)}`
  const plan = gamePlanUrl(args.unsubscribeToken)
  const roleLine = args.role
    ? `We will bias picks toward <strong>${escapeHtml(args.role)}</strong>.`
    : 'We will personalize as we learn more about your path.'
  const subject = 'Welcome to dear[CC] The Letter'
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4f4f5;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#141414">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;background:#ffffff">
    ${brandHeader()}
    <div style="font-size:12px;color:#71717a;font-family:ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:20px">Welcome</div>
    <p style="font-size:15px;line-height:1.6;margin:0 0 14px">You are on the list. Every Sunday we send a 15-minute note — curated AI signal, role-relevant reads, and one thing to build.</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 14px">${roleLine}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px">Keep exploring in <a href="${fieldReportUrl()}" style="color:#d4552f">Field Report</a> — or take the next step:</p>
    <p style="margin:0 0 24px">
      <a href="${escapeHtml(plan)}" style="display:inline-block;background:#d4552f;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 18px;border-radius:10px">Build your Game Plan</a>
    </p>
    <p style="font-size:12px;color:#71717a;margin:0;line-height:1.6">
      <a href="${escapeHtml(unsub)}" style="color:#71717a">Unsubscribe</a>
    </p>
  </div>
</body></html>`
  const text = `Welcome to dear[CC] The Letter

You are on the list. Sundays ~15 min: curated AI signal, role reads, one build.

${args.role ? `Biasing toward: ${args.role}` : ''}

Field Report: ${fieldReportUrl()}
Build your Game Plan: ${plan}
Unsubscribe: ${unsub}`
  return { subject, html, text }
}

/** Legacy template-shaped weekly email (fallback when curation is unavailable). */
export function buildWeeklyNewsletterEmail(args: {
  content: WeeklyIssueContent
  unsubscribeToken: string
  date?: Date
}): { subject: string; html: string; text: string } {
  const d = args.date ?? new Date()
  const dateLabel = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const unsub = `${baseUrl()}/api/unsubscribe?t=${encodeURIComponent(args.unsubscribeToken)}`
  const plan = gamePlanUrl(args.unsubscribeToken)
  const { content } = args
  const sectionsHtml = content.sections
    .map(
      (s) => `
      <h3 style="font-family:Fraunces,Georgia,serif;font-size:18px;margin:24px 0 8px;color:#141414">${escapeHtml(s.title)}</h3>
      <p style="font-size:15px;line-height:1.6;margin:0;color:#141414">${escapeHtml(s.body)}</p>`,
    )
    .join('')
  const subject = `dear[CC] The Letter — ${dateLabel}: ${content.headline}`

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4f4f5;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#141414">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;background:#ffffff">
    ${brandHeader()}
    <div style="font-size:12px;color:#71717a;font-family:ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:20px">Weekly · ${escapeHtml(dateLabel)}</div>
    <h1 style="font-family:Fraunces,Georgia,serif;font-size:24px;font-weight:500;line-height:1.3;margin:0 0 12px;color:#141414">${escapeHtml(content.headline)}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 8px">${escapeHtml(content.intro)}</p>
    ${sectionsHtml}
    <hr style="border:none;border-top:1px solid #e4e4e7;margin:28px 0" />
    <div style="font-size:12px;color:#71717a;font-family:ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">Tool of the week</div>
    <p style="font-size:15px;line-height:1.6;margin:0"><strong>${escapeHtml(content.toolOfTheWeek.name)}</strong> — ${escapeHtml(content.toolOfTheWeek.blurb)}</p>
    <hr style="border:none;border-top:1px solid #e4e4e7;margin:28px 0" />
    <div style="font-size:12px;color:#71717a;font-family:ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">Action item</div>
    <div style="font-size:14px;line-height:1.55;background:#fdf2ee;border-left:3px solid #d4552f;padding:12px 14px;border-radius:0 6px 6px 0">${escapeHtml(content.actionItem)}</div>
    <hr style="border:none;border-top:1px solid #e4e4e7;margin:28px 0" />
    <p style="font-size:15px;line-height:1.6;margin:0 0 12px">Ready for a personalized gap analysis?</p>
    <p style="margin:0 0 24px">
      <a href="${escapeHtml(plan)}" style="display:inline-block;background:#d4552f;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 18px;border-radius:10px">Build your Game Plan</a>
    </p>
    <p style="font-size:12px;color:#71717a;margin:0;line-height:1.6">
      You are getting this because you signed up for dear[CC] The Letter from Field Report.
      <a href="${escapeHtml(unsub)}" style="color:#71717a">Unsubscribe</a>
    </p>
  </div>
</body></html>`

  const text = `dear[CC] The Letter — ${dateLabel}

${content.headline}

${content.intro}

${content.sections.map((s) => `${s.title}\n${s.body}`).join('\n\n')}

Tool of the week: ${content.toolOfTheWeek.name} — ${content.toolOfTheWeek.blurb}

Action: ${content.actionItem}

Build your Game Plan: ${plan}
Unsubscribe: ${unsub}`

  return { subject, html, text }
}

function renderCallout(label: string, body: string, bg: string, accent: string): string {
  return `<div style="font-size:14px;line-height:1.55;color:#141414;background:${bg};border-left:3px solid ${accent};padding:12px 14px;margin:12px 0;border-radius:0 6px 6px 0">
    <span style="font-weight:600">${escapeHtml(label)}:</span> ${escapeHtml(body)}
  </div>`
}

function renderArticle(a: CuratedArticle, opts: { isLead?: boolean; index?: number } = {}): string {
  const { isLead = false, index } = opts
  const titleSize = isLead ? '22px' : '18px'
  const indexLabel = index ? `${index}. ` : ''
  const summaryHtml = (a.summary ?? [])
    .map(
      (s) =>
        `<li style="margin:0 0 8px;font-size:15px;line-height:1.55;color:#141414">${escapeHtml(s)}</li>`,
    )
    .join('')
  const host = shortHost(a.sourceUrl)
  const href = escapeHtml(safeHttpUrl(a.sourceUrl))

  return `
    <h${isLead ? '1' : '3'} style="font-family:Fraunces,Georgia,serif;font-size:${titleSize};font-weight:500;margin:${isLead ? '0' : '28'}px 0 4px;color:#141414;line-height:1.3">
      ${indexLabel}<a href="${href}" style="color:#141414;text-decoration:none">${escapeHtml(a.title)}</a>
    </h${isLead ? '1' : '3'}>
    <div style="font-size:13px;color:#71717a;margin-bottom:10px;font-family:ui-monospace,Menlo,monospace">
      <a href="${href}" style="color:#71717a">${escapeHtml(host)}</a>
      ${a.publishedDate ? ` · ${escapeHtml(a.publishedDate)}` : ''}
    </div>
    ${renderCallout("Why it's relevant", a.whyRelevant, '#fdf2ee', '#d4552f')}
    <div style="font-size:12px;color:#71717a;font-family:ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:0.06em;margin:14px 0 6px">What it says</div>
    <ul style="margin:0 0 6px;padding-left:20px">${summaryHtml}</ul>
    ${renderCallout('What to do this week', a.takeaway, '#f4f4f5', '#52525b')}
  `
}

function renderBuild(b: IssuePayload['buildExercise']): string {
  if (!b?.title) return ''
  const stepsHtml = (b.steps ?? [])
    .map(
      (s, i) => `
      <tr>
        <td style="width:28px;vertical-align:top;font-weight:700;color:#141414;font-size:15px;line-height:1.55;padding:0 8px 14px 0">${i + 1}.</td>
        <td style="vertical-align:top;font-size:15px;line-height:1.55;padding:0 0 14px 0">
          <strong style="color:#141414;font-weight:600">${escapeHtml(s.step)}</strong>
          <div style="margin-top:4px;color:#141414">${escapeHtml(s.detail)}</div>
        </td>
      </tr>`,
    )
    .join('')
  const tools = (b.tools ?? [])
    .map(
      (t) =>
        `<span style="display:inline-block;font-size:12px;color:#141414;background:#f4f4f5;border:1px solid #e4e4e7;padding:2px 8px;border-radius:4px;margin-right:6px;margin-bottom:4px;font-family:ui-monospace,Menlo,monospace">${escapeHtml(t)}</span>`,
    )
    .join('')

  return `
    <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0" />
    <div style="font-size:12px;color:#71717a;font-family:ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">Build this week</div>
    <h3 style="font-family:Fraunces,Georgia,serif;font-size:20px;font-weight:500;margin:0 0 6px;color:#141414">${escapeHtml(b.title)}</h3>
    <div style="font-size:13px;color:#71717a;margin-bottom:8px">${escapeHtml(b.timeEstimate || '')} · ${tools}</div>
    ${renderCallout('Why I picked this for you', b.whyPicked, '#fdf2ee', '#d4552f')}
    <p style="font-size:15px;line-height:1.6;color:#141414;margin:12px 0">${escapeHtml(b.pitch || '')}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:12px 0">${stepsHtml}</table>
  `
}

function renderQuizInline(quiz: IssuePayload['quiz']): string {
  if (!quiz?.questions?.length) return ''
  const blocks = quiz.questions
    .map((q, i) => {
      const opts = (q.options ?? [])
        .map(
          (o, j) =>
            `<li style="margin:0 0 4px;font-size:14px;line-height:1.5;color:#141414">${String.fromCharCode(65 + j)}. ${escapeHtml(o)}</li>`,
        )
        .join('')
      return `
      <div style="margin:0 0 18px">
        <p style="font-size:15px;font-weight:600;margin:0 0 8px;color:#141414">${i + 1}. ${escapeHtml(q.question)}</p>
        <ul style="margin:0;padding-left:18px;list-style:none">${opts}</ul>
        <p style="font-size:13px;color:#71717a;margin:8px 0 0;line-height:1.5"><strong>Answer:</strong> ${escapeHtml(String.fromCharCode(65 + (q.correctIndex ?? 0)))}. ${escapeHtml(q.explanation ?? '')}</p>
      </div>`
    })
    .join('')
  return `
    <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0" />
    <div style="font-size:12px;color:#71717a;font-family:ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">Pressure-test your read</div>
    ${blocks}
  `
}

/** Full curation-model weekly email (StayRelevant prompt shape, Letter aesthetic). */
export function buildCuratedWeeklyEmail(args: {
  payload: IssuePayload
  unsubscribeToken: string
  role?: string | null
  date?: Date
}): { subject: string; html: string; text: string } {
  const d = args.date ?? new Date()
  const dateLabel = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const unsub = `${baseUrl()}/api/unsubscribe?t=${encodeURIComponent(args.unsubscribeToken)}`
  const plan = gamePlanUrl(args.unsubscribeToken)
  const { payload } = args
  const lead = payload.newsletterPicks?.[0]?.title ?? payload.news?.title ?? 'This week'
  const subject = `dear[CC] The Letter — ${lead}`

  const newsletterBlocks = (payload.newsletterPicks ?? [])
    .map((a, i) => renderArticle(a, { isLead: i === 0, index: i === 0 ? undefined : i + 1 }))
    .join('\n')
  const newsBlock = renderArticle(payload.news, { isLead: false })
  const roleBlocks = (payload.forYourRole ?? [])
    .map((a, i) => renderArticle(a, { index: i + 1 }))
    .join('\n')

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4f4f5;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#141414">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;background:#ffffff">
    ${brandHeader()}
    <div style="font-size:12px;color:#71717a;font-family:ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:20px">Weekly · ${escapeHtml(dateLabel)}</div>

    <div style="font-size:12px;color:#71717a;font-family:ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 6px">From the newsletters</div>
    ${newsletterBlocks}

    <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0" />
    <div style="font-size:12px;color:#71717a;font-family:ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 6px">Big AI news this week</div>
    ${newsBlock}

    <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0" />
    <div style="font-size:12px;color:#71717a;font-family:ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">For your role</div>
    ${roleBlocks}

    ${renderBuild(payload.buildExercise)}
    ${renderQuizInline(payload.quiz)}

    <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0" />
    <p style="font-size:15px;line-height:1.6;margin:0 0 12px">Ready for a personalized gap analysis?</p>
    <p style="margin:0 0 24px">
      <a href="${escapeHtml(plan)}" style="display:inline-block;background:#d4552f;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 18px;border-radius:10px">Build your Game Plan</a>
    </p>
    <p style="font-size:12px;color:#71717a;margin:0;line-height:1.6">
      Articles are curated, not rewritten — every pick links to the original source.
      You signed up for dear[CC] The Letter from Field Report.
      <a href="${escapeHtml(unsub)}" style="color:#71717a">Unsubscribe</a>
    </p>
  </div>
</body></html>`

  const articleText = (a: CuratedArticle, prefix: string): string =>
    `${prefix} ${a.title}
   ${safeHttpUrl(a.sourceUrl)}

   Why it's relevant: ${a.whyRelevant}

   What it says:
${(a.summary ?? []).map((s) => `   • ${s}`).join('\n')}

   What to do: ${a.takeaway}`

  const text = `dear[CC] The Letter — ${dateLabel}

FROM THE NEWSLETTERS

${(payload.newsletterPicks ?? []).map((a, i) => articleText(a, `${i + 1}.`)).join('\n\n')}

---

BIG AI NEWS THIS WEEK
${articleText(payload.news, '')}

---

FOR YOUR ROLE

${(payload.forYourRole ?? []).map((a, i) => articleText(a, `${i + 1}.`)).join('\n\n')}

---

BUILD THIS WEEK
${payload.buildExercise?.title ?? ''}
${payload.buildExercise?.pitch ?? ''}

Build your Game Plan: ${plan}
Unsubscribe: ${unsub}`

  return { subject, html, text }
}
