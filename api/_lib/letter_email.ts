import { baseUrl, escapeHtml, fieldReportUrl } from './html.js'
import type { WeeklyIssueContent } from './templates.js'

function gamePlanUrl(token: string): string {
  return `${baseUrl()}/plan?from=letter&t=${encodeURIComponent(token)}`
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
    <div style="font-family:Fraunces,Georgia,'Times New Roman',serif;font-size:22px;font-weight:500;margin-bottom:4px">
      dear<span style="color:#d4552f">[</span><span style="color:#d4552f">CC</span><span style="color:#d4552f">]</span> The Letter
    </div>
    <div style="font-size:12px;color:#71717a;font-family:ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:20px">Welcome</div>
    <p style="font-size:15px;line-height:1.6;margin:0 0 14px">You are on the list. Every Sunday we send a 15-minute note — AI signal, labor-market context, and one thing to build.</p>
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

You are on the list. Sundays ~15 min: AI signal, labor-market context, one build.

${args.role ? `Biasing toward: ${args.role}` : ''}

Field Report: ${fieldReportUrl()}
Build your Game Plan: ${plan}
Unsubscribe: ${unsub}`
  return { subject, html, text }
}

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
    <div style="font-family:Fraunces,Georgia,'Times New Roman',serif;font-size:22px;font-weight:500;margin-bottom:4px">
      dear<span style="color:#d4552f">[</span><span style="color:#d4552f">CC</span><span style="color:#d4552f">]</span> The Letter
    </div>
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
