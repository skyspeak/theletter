import { randomBytes } from 'node:crypto'
import { sendLetterEmail } from './email.js'
import { buildWelcomeEmail } from './letter_email.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_FIELD = 200
const MAX_ARRAY = 12

export type EnrollInput = {
  email: string
  industry?: string | null
  role?: string | null
  name?: string | null
  focusAreas?: string[] | null
  sourceRef?: string | null
  linkedinUrl?: string | null
  targetJob?: string | null
}

export type EnrollResult =
  | { ok: true; skipped: 'already_enrolled'; unsubscribeToken: string }
  | { ok: true; welcomeSent: boolean; unsubscribeToken: string }
  | { ok: false; error: string; status: number }

type MockSub = {
  id: string
  email: string
  name: string | null
  role: string | null
  industry: string | null
  focusAreas: string[]
  linkedinUrl: string | null
  targetJob: string | null
  sourceRef: string | null
  unsubscribeToken: string
  welcomeSentAt: Date | null
  unsubscribedAt: Date | null
}

const mockStore = new Map<string, MockSub>()

/** Local UI testing without Neon/Resend. */
export function isMockEnroll(): boolean {
  return (
    process.env.LETTER_MOCK_DB === '1' ||
    process.env.DATABASE_URL === 'mock' ||
    (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production')
  )
}

function cap(s: string, n = MAX_FIELD) {
  return s.slice(0, n)
}

function normalizeFocusAreas(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const v of input) {
    if (typeof v !== 'string') continue
    const t = cap(v.trim(), 100)
    if (!t) continue
    const k = t.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(t)
    if (out.length >= MAX_ARRAY) break
  }
  return out
}

function parseFields(input: EnrollInput) {
  return {
    role:
      typeof input.role === 'string' && input.role.trim() ? cap(input.role.trim()) : null,
    industry:
      typeof input.industry === 'string' && input.industry.trim()
        ? cap(input.industry.trim())
        : null,
    name:
      typeof input.name === 'string' && input.name.trim() ? cap(input.name.trim()) : null,
    focusAreas: normalizeFocusAreas(input.focusAreas),
    sourceRef:
      typeof input.sourceRef === 'string' ? input.sourceRef.trim().slice(0, 80) : null,
    linkedinUrl:
      typeof input.linkedinUrl === 'string' && input.linkedinUrl.trim()
        ? cap(input.linkedinUrl.trim(), 500)
        : null,
    targetJob:
      typeof input.targetJob === 'string' && input.targetJob.trim()
        ? cap(input.targetJob.trim(), 1000)
        : null,
  }
}

async function enrollMock(email: string, input: EnrollInput): Promise<EnrollResult> {
  const f = parseFields(input)
  const existing = mockStore.get(email)
  const token = existing?.unsubscribeToken ?? randomBytes(24).toString('hex')
  const alreadyWelcomed = Boolean(existing && !existing.unsubscribedAt && existing.welcomeSentAt)

  const sub: MockSub = {
    id: existing?.id ?? `mock_${randomBytes(8).toString('hex')}`,
    email,
    name: f.name ?? existing?.name ?? null,
    role: f.role ?? existing?.role ?? null,
    industry: f.industry ?? existing?.industry ?? null,
    focusAreas: f.focusAreas.length
      ? f.focusAreas
      : (existing?.focusAreas ?? ['AI literacy', 'career planning']),
    linkedinUrl: f.linkedinUrl ?? existing?.linkedinUrl ?? null,
    targetJob: f.targetJob ?? existing?.targetJob ?? null,
    sourceRef: f.sourceRef ?? existing?.sourceRef ?? null,
    unsubscribeToken: token,
    welcomeSentAt: existing?.welcomeSentAt ?? null,
    unsubscribedAt: null,
  }
  mockStore.set(email, sub)

  console.log('[letter:mock] enroll', {
    email: sub.email,
    role: sub.role,
    industry: sub.industry,
    linkedinUrl: sub.linkedinUrl,
    alreadyWelcomed,
  })

  if (alreadyWelcomed) {
    return { ok: true, skipped: 'already_enrolled', unsubscribeToken: sub.unsubscribeToken }
  }

  // Pretend welcome sent — no Resend in mock mode
  sub.welcomeSentAt = new Date()
  mockStore.set(email, sub)
  return { ok: true, welcomeSent: true, unsubscribeToken: sub.unsubscribeToken }
}

export async function enrollSubscriber(input: EnrollInput): Promise<EnrollResult> {
  const email = input.email.trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: 'invalid email', status: 400 }
  }

  if (isMockEnroll()) {
    return enrollMock(email, input)
  }

  if (!process.env.DATABASE_URL) {
    return { ok: false, error: 'letter enroll not configured', status: 503 }
  }

  const { prisma } = await import('./db.js')
  const f = parseFields(input)

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } })
  const token = existing?.unsubscribeToken ?? randomBytes(24).toString('hex')
  const alreadyWelcomed = Boolean(existing && !existing.unsubscribedAt && existing.welcomeSentAt)

  const sub = await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: {
      email,
      name: f.name,
      role: f.role,
      industry: f.industry,
      focusAreas: f.focusAreas.length ? f.focusAreas : ['AI literacy', 'career planning'],
      unsubscribeToken: token,
      sourceRef: f.sourceRef,
      ...(f.linkedinUrl ? { linkedinUrl: f.linkedinUrl } : {}),
      ...(f.targetJob ? { targetJob: f.targetJob } : {}),
    },
    update: {
      ...(f.name ? { name: f.name } : {}),
      ...(f.role ? { role: f.role } : {}),
      ...(f.industry ? { industry: f.industry } : {}),
      ...(f.focusAreas.length ? { focusAreas: f.focusAreas } : {}),
      ...(f.sourceRef ? { sourceRef: f.sourceRef } : {}),
      ...(f.linkedinUrl ? { linkedinUrl: f.linkedinUrl } : {}),
      ...(f.targetJob ? { targetJob: f.targetJob } : {}),
      unsubscribedAt: null,
    },
  })

  if (alreadyWelcomed) {
    return { ok: true, skipped: 'already_enrolled', unsubscribeToken: sub.unsubscribeToken }
  }

  let welcomeSent = Boolean(sub.welcomeSentAt)
  if (!sub.welcomeSentAt) {
    if (!process.env.RESEND_API_KEY) {
      return { ok: false, error: 'RESEND_API_KEY not configured', status: 503 }
    }
    const mail = buildWelcomeEmail({
      email: sub.email,
      role: sub.role,
      unsubscribeToken: sub.unsubscribeToken,
    })
    await sendLetterEmail({
      to: sub.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    })
    await prisma.newsletterSubscriber.update({
      where: { id: sub.id },
      data: { welcomeSentAt: new Date() },
    })
    welcomeSent = true
  }

  return { ok: true, welcomeSent, unsubscribeToken: sub.unsubscribeToken }
}
