import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { timingSafeEqual } from 'node:crypto'
import { composeWeeklyIssue } from './compose.js'
import { sendLetterEmail } from './email.js'
import { buildCuratedWeeklyEmail, buildWeeklyNewsletterEmail } from './letter_email.js'

const DEFAULT_TO = 'skyspeak@gmail.com'
const RATE_MS = 60_000
const RATE_FILE = '/tmp/letter-test-email-at'

export function testLetterRecipient(): string {
  return (process.env.TEST_LETTER_TO ?? DEFAULT_TO).trim().toLowerCase()
}

export function isTestLetterSecretValid(got: string): boolean {
  const expected = process.env.TEST_LETTER_SECRET
  if (!expected || !got) return false
  try {
    const a = Buffer.from(got)
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

function readLastTestAt(): number {
  const g = globalThis as unknown as { __letterTestEmailAt?: number }
  let last = g.__letterTestEmailAt ?? 0
  try {
    if (existsSync(RATE_FILE)) {
      const n = Number(readFileSync(RATE_FILE, 'utf8').trim())
      if (Number.isFinite(n)) last = Math.max(last, n)
    }
  } catch {
    /* ignore */
  }
  return last
}

function markTestAt(now: number): void {
  const g = globalThis as unknown as { __letterTestEmailAt?: number }
  g.__letterTestEmailAt = now
  try {
    writeFileSync(RATE_FILE, String(now))
  } catch {
    /* ignore */
  }
}

export type TestLetterResult =
  | { ok: true; to: string; mode: 'curated' | 'template'; subject: string }
  | { ok: false; error: string; status: number; retryAfterSec?: number }

/** Generate one weekly-style issue and send it to the test inbox. Max once / minute. */
export async function sendTestLetter(): Promise<TestLetterResult> {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: 'RESEND_API_KEY not configured', status: 503 }
  }

  const now = Date.now()
  const last = readLastTestAt()
  if (last && now - last < RATE_MS) {
    return {
      ok: false,
      error: 'rate limited — try again in a minute',
      status: 429,
      retryAfterSec: Math.ceil((RATE_MS - (now - last)) / 1000),
    }
  }

  const to = testLetterRecipient()
  let persona: {
    email: string
    name: string | null
    role: string | null
    industry: string | null
    focusAreas: string[]
    company: string | null
    seniority: string | null
    technicalLevel: string | null
    preferredTools: string[]
    about: string | null
    experienceSummary: string | null
  } = {
    email: to,
    name: 'Sky',
    role: 'Founder',
    industry: 'Technology',
    focusAreas: ['AI literacy', 'career planning'],
    company: null,
    seniority: null,
    technicalLevel: 'some',
    preferredTools: ['ChatGPT', 'Claude.ai'],
    about: null,
    experienceSummary: null,
  }

  if (process.env.DATABASE_URL && process.env.DATABASE_URL !== 'mock') {
    try {
      const { prisma } = await import('./db.js')
      const sub = await prisma.newsletterSubscriber.findUnique({ where: { email: to } })
      if (sub) {
        persona = {
          email: sub.email,
          name: sub.name,
          role: sub.role,
          industry: sub.industry,
          focusAreas: sub.focusAreas,
          company: sub.company,
          seniority: sub.seniority,
          technicalLevel: sub.technicalLevel,
          preferredTools: sub.preferredTools,
          about: sub.about,
          experienceSummary: sub.experienceSummary,
        }
      }
    } catch {
      /* use defaults */
    }
  }

  const composed = await composeWeeklyIssue(persona, new Date())
  const unsubToken = 'test-letter'
  const mail =
    composed.mode === 'curated'
      ? buildCuratedWeeklyEmail({
          payload: composed.payload,
          unsubscribeToken: unsubToken,
          role: persona.role,
          date: new Date(),
        })
      : buildWeeklyNewsletterEmail({
          content: composed.content,
          unsubscribeToken: unsubToken,
          date: new Date(),
        })

  const subject = `[TEST] ${mail.subject}`

  // Mark rate limit before send so a hung LLM call can't be spammed in parallel;
  // if send fails, still keep the cooldown.
  markTestAt(now)

  await sendLetterEmail({
    to,
    subject,
    html: mail.html,
    text: mail.text,
  })

  return {
    ok: true,
    to,
    mode: composed.mode,
    subject,
  }
}
