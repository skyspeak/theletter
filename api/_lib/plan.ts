import { prisma } from './db.js'
import { enrollSubscriber } from './enroll.js'
import { matchOccupation } from './match_occupation.js'
import { parseJob } from './parse_job.js'
import { buildGamePlanContent } from './plan_analyze.js'
import type { PlanResult } from './plan_types.js'

export type ProfileResult =
  | {
      ok: true
      email: string
      role: string | null
      industry: string | null
      focusAreas: string[]
      sourceRef: string | null
      linkedinUrl: string | null
      targetJob: string | null
      name: string | null
    }
  | { ok: false; error: string; status: number }

export async function getPlanProfile(token: string): Promise<ProfileResult> {
  const t = token.trim()
  if (!t) return { ok: false, error: 'missing token', status: 400 }
  if (!process.env.DATABASE_URL) {
    return { ok: false, error: 'database not configured', status: 503 }
  }

  const sub = await prisma.newsletterSubscriber.findUnique({
    where: { unsubscribeToken: t },
  })
  if (!sub || sub.unsubscribedAt) {
    return { ok: false, error: 'invalid token', status: 404 }
  }

  return {
    ok: true,
    email: sub.email,
    role: sub.role,
    industry: sub.industry,
    focusAreas: sub.focusAreas,
    sourceRef: sub.sourceRef,
    linkedinUrl: sub.linkedinUrl,
    targetJob: sub.targetJob,
    name: sub.name,
  }
}

export type AnalyzeInput = {
  email: string
  jobInput: string
  linkedinUrl?: string | null
  focusNote?: string | null
  fromLetter?: boolean
  token?: string | null
  name?: string | null
  role?: string | null
  industry?: string | null
  focusAreas?: string[] | null
  sourceRef?: string | null
}

export type AnalyzeResult =
  | { ok: true; plan: PlanResult }
  | { ok: false; error: string; status: number }

export async function analyzeGamePlan(input: AnalyzeInput): Promise<AnalyzeResult> {
  const email = input.email.trim().toLowerCase()
  const jobInput = input.jobInput.trim()
  if (!email || !jobInput) {
    return { ok: false, error: 'email and job are required', status: 400 }
  }
  if (!process.env.DATABASE_URL) {
    return { ok: false, error: 'database not configured', status: 503 }
  }

  let personaRole = input.role
  let personaIndustry = input.industry
  let personaFocus = input.focusAreas
  let personaSource = input.sourceRef
  let personaName = input.name
  let linkedinUrl = input.linkedinUrl?.trim() || null

  if (input.token) {
    const profile = await getPlanProfile(input.token)
    if (profile.ok) {
      personaRole = personaRole || profile.role
      personaIndustry = personaIndustry || profile.industry
      personaFocus = personaFocus?.length ? personaFocus : profile.focusAreas
      personaSource = personaSource || profile.sourceRef
      personaName = personaName || profile.name
      linkedinUrl = linkedinUrl || profile.linkedinUrl
    }
  }

  const enroll = await enrollSubscriber({
    email,
    role: personaRole,
    industry: personaIndustry,
    focusAreas: personaFocus,
    sourceRef: personaSource,
    name: personaName,
    linkedinUrl,
    targetJob: jobInput,
  })
  if (!enroll.ok) {
    return { ok: false, error: enroll.error, status: enroll.status }
  }

  const job = parseJob(jobInput)
  const labor = matchOccupation(job.title ?? job.detail)
  const { analysis, roadmap } = await buildGamePlanContent({
    email,
    job,
    persona: {
      name: personaName,
      role: personaRole,
      industry: personaIndustry,
      focusAreas: personaFocus,
      focusNote: input.focusNote,
      linkedinUrl,
    },
    labor,
  })

  const row = await prisma.gamePlan.create({
    data: {
      email,
      linkedinUrl,
      jobInput,
      jobDetail: job.detail,
      jobSubject: job.subject,
      focusNote: input.focusNote?.trim() || null,
      matchedSoc: labor?.soc ?? null,
      analysis,
      roadmap,
      fromLetter: Boolean(input.fromLetter || input.token),
    },
  })

  return {
    ok: true,
    plan: {
      id: row.id,
      email,
      jobDetail: job.detail,
      jobSubject: job.subject,
      matchedSoc: labor?.soc ?? null,
      analysis,
      roadmap,
      fromLetter: row.fromLetter,
    },
  }
}

export type WaitlistResult =
  | { ok: true; email: string }
  | { ok: false; error: string; status: number }

export async function joinCohortWaitlist(emailRaw: string): Promise<WaitlistResult> {
  const email = emailRaw.trim().toLowerCase()
  if (!email.includes('@')) {
    return { ok: false, error: 'invalid email', status: 400 }
  }
  if (!process.env.DATABASE_URL) {
    return { ok: false, error: 'database not configured', status: 503 }
  }

  const enroll = await enrollSubscriber({ email })
  if (!enroll.ok) {
    return { ok: false, error: enroll.error, status: enroll.status }
  }

  await prisma.newsletterSubscriber.update({
    where: { email },
    data: { cohortWaitlistedAt: new Date() },
  })

  return { ok: true, email }
}

export async function getGamePlanById(id: string): Promise<AnalyzeResult> {
  if (!id.trim()) return { ok: false, error: 'missing id', status: 400 }
  if (!process.env.DATABASE_URL) {
    return { ok: false, error: 'database not configured', status: 503 }
  }
  const row = await prisma.gamePlan.findUnique({ where: { id } })
  if (!row) return { ok: false, error: 'not found', status: 404 }

  return {
    ok: true,
    plan: {
      id: row.id,
      email: row.email,
      jobDetail: row.jobDetail ?? '',
      jobSubject: row.jobSubject ?? '',
      matchedSoc: row.matchedSoc,
      analysis: row.analysis as PlanResult['analysis'],
      roadmap: row.roadmap as PlanResult['roadmap'],
      fromLetter: row.fromLetter,
    },
  }
}
