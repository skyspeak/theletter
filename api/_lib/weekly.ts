import { prisma } from './db.js'
import { buildWeeklyIssueContent } from './compose.js'
import { sendLetterEmail } from './email.js'
import { buildWeeklyNewsletterEmail } from './letter_email.js'

const COOLDOWN_MS = 6 * 24 * 60 * 60 * 1000

export type WeeklySendOptions = {
  force?: boolean
  dryRun?: boolean
  limit?: number
  email?: string
}

export type WeeklySendResult = {
  considered: number
  sent: number
  skipped: number
  errors: Array<{ email: string; error: string }>
  dryRun: boolean
}

export async function sendWeeklyNewsletter(
  opts: WeeklySendOptions = {},
): Promise<WeeklySendResult> {
  const now = new Date()
  const where = opts.email
    ? { email: opts.email.trim().toLowerCase(), unsubscribedAt: null }
    : { unsubscribedAt: null }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    ...(opts.limit && opts.limit > 0 ? { take: opts.limit } : {}),
  })

  const result: WeeklySendResult = {
    considered: subscribers.length,
    sent: 0,
    skipped: 0,
    errors: [],
    dryRun: Boolean(opts.dryRun),
  }

  for (const sub of subscribers) {
    if (
      !opts.force &&
      sub.lastIssueSentAt &&
      now.getTime() - sub.lastIssueSentAt.getTime() < COOLDOWN_MS
    ) {
      result.skipped++
      continue
    }

    try {
      const content = await buildWeeklyIssueContent({
        name: sub.name,
        role: sub.role,
        industry: sub.industry,
        focusAreas: sub.focusAreas,
      })
      const mail = buildWeeklyNewsletterEmail({
        content,
        unsubscribeToken: sub.unsubscribeToken,
        date: now,
      })

      if (!opts.dryRun) {
        if (!process.env.RESEND_API_KEY) {
          throw new Error('RESEND_API_KEY not configured')
        }
        await sendLetterEmail({
          to: sub.email,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        })
        await prisma.newsletterSubscriber.update({
          where: { id: sub.id },
          data: { lastIssueSentAt: now },
        })
      }
      result.sent++
    } catch (e) {
      result.errors.push({
        email: sub.email,
        error: e instanceof Error ? e.message : 'send failed',
      })
    }
  }

  return result
}
