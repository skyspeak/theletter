import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlanSteps } from '../components/plan/PlanSteps'
import { PLAN_EMAIL_KEY, PLAN_LINKEDIN_KEY, type PlanProfile } from '../lib/planTypes'
import { usePlan } from '../data/PlanContext'

function readStored(key: string) {
  try {
    return sessionStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

export function PlanConnectPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const fromLetter = params.get('from') === 'letter'
  const token = params.get('t') ?? ''
  const emailParam = params.get('email')?.trim() ?? ''
  const linkedinParam = params.get('linkedin')?.trim() ?? ''
  const { clearPlan } = usePlan()

  const [profile, setProfile] = useState<PlanProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(fromLetter && Boolean(token))
  const [profileError, setProfileError] = useState<string | null>(null)

  const [email, setEmail] = useState(
    () => emailParam || readStored(PLAN_EMAIL_KEY),
  )
  const [linkedin, setLinkedin] = useState(
    () => linkedinParam || readStored(PLAN_LINKEDIN_KEY),
  )
  const [job, setJob] = useState('')
  const [focusNote, setFocusNote] = useState('')
  const [useLetterProfile, setUseLetterProfile] = useState(
    () =>
      (fromLetter && Boolean(token)) ||
      Boolean((emailParam || readStored(PLAN_EMAIL_KEY)) && (linkedinParam || readStored(PLAN_LINKEDIN_KEY))),
  )

  useEffect(() => {
    if (token) return
    const nextEmail = emailParam || readStored(PLAN_EMAIL_KEY)
    const nextLinkedin = linkedinParam || readStored(PLAN_LINKEDIN_KEY)
    if (nextEmail) setEmail(nextEmail)
    if (nextLinkedin) setLinkedin(nextLinkedin)
    if (nextEmail && nextLinkedin) {
      setUseLetterProfile(true)
      setProfile((prev) =>
        prev ?? {
          email: nextEmail,
          role: null,
          industry: null,
          focusAreas: [],
          sourceRef: null,
          linkedinUrl: nextLinkedin,
          targetJob: null,
          name: null,
        },
      )
    }
  }, [emailParam, linkedinParam, token])

  useEffect(() => {
    if (!fromLetter || !token) return
    let cancelled = false
    ;(async () => {
      setProfileLoading(true)
      setProfileError(null)
      try {
        const res = await fetch(`/api/plan/profile?t=${encodeURIComponent(token)}`)
        const data = (await res.json().catch(() => ({}))) as PlanProfile & {
          error?: string
          ok?: boolean
        }
        if (!res.ok) throw new Error(data.error ?? 'Could not load your Letter profile')
        if (cancelled) return
        setProfile(data)
        setEmail(data.email)
        if (data.linkedinUrl) setLinkedin(data.linkedinUrl)
        if (data.targetJob) setJob(data.targetJob)
        setUseLetterProfile(true)
      } catch (e) {
        if (!cancelled) {
          setProfileError(e instanceof Error ? e.message : 'Profile lookup failed')
          setUseLetterProfile(false)
        }
      } finally {
        if (!cancelled) setProfileLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [fromLetter, token])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmedEmail = email.trim()
    const trimmedJob = job.trim()
    if (!trimmedEmail || !trimmedJob) return
    if (!useLetterProfile && !linkedin.trim()) return

    clearPlan()
    try {
      sessionStorage.setItem(PLAN_EMAIL_KEY, trimmedEmail.toLowerCase())
      if (linkedin.trim()) sessionStorage.setItem(PLAN_LINKEDIN_KEY, linkedin.trim())
    } catch {
      /* ignore */
    }
    const qs = new URLSearchParams({
      email: trimmedEmail,
      job: trimmedJob,
    })
    if (linkedin.trim()) qs.set('linkedin', linkedin.trim())
    if (focusNote.trim()) qs.set('focus', focusNote.trim())
    if (token && useLetterProfile) {
      qs.set('from', 'letter')
      qs.set('t', token)
    } else if (fromLetter || useLetterProfile) {
      qs.set('from', 'letter')
    }
    navigate(`/plan/building?${qs.toString()}`)
  }

  function onFocusKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      e.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-8 sm:py-14">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <p className="text-xs uppercase tracking-wider text-muted font-mono mb-2">
          Part 3 · Game Plan
        </p>
        <h1 className="font-serif text-2xl sm:text-4xl text-ink tracking-tight">
          Let&apos;s build your Game Plan
        </h1>
        <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed">
          Paste the job you&apos;re going after. We&apos;ll match it to labor-market data
          and map the gaps against your Letter profile.
        </p>

        <div className="mt-6 sm:mt-8">
          <PlanSteps active="connect" />
        </div>

        {profileLoading ? (
          <p className="text-sm text-muted">Loading your Letter profile…</p>
        ) : null}

        {profileError ? (
          <p role="alert" className="mb-4 text-sm text-red-600">
            {profileError} — you can still start fresh below.
          </p>
        ) : null}

        {useLetterProfile && (profile || (email && linkedin)) ? (
          <div className="mb-6 rounded-xl border border-border bg-surface px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">Using your profile from The Letter</p>
                <p className="mt-1 text-sm text-muted break-words">
                  {profile?.email || email}
                  {profile?.role ? ` · ${profile.role}` : ''}
                </p>
                {(profile?.linkedinUrl || linkedin) ? (
                  <p className="mt-1 text-sm text-muted break-all">
                    {profile?.linkedinUrl || linkedin}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="self-start text-sm text-primary underline underline-offset-2 shrink-0 min-h-11 sm:min-h-0 py-2 sm:py-0"
                onClick={() => setUseLetterProfile(false)}
              >
                Not you?
              </button>
            </div>
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-5">
          {!useLetterProfile ? (
            <>
              <div>
                <label htmlFor="plan-linkedin" className="block text-sm font-medium text-ink">
                  LinkedIn profile <span className="text-primary">*</span>
                </label>
                <input
                  id="plan-linkedin"
                  type="text"
                  required
                  autoFocus={!useLetterProfile}
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="linkedin.com/in/your-profile"
                  className="mt-2 w-full rounded-xl border border-border-bright bg-white px-4 py-3.5 sm:py-3 text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="mt-1.5 text-xs text-muted">
                  We store the URL for context — we do not scrape LinkedIn.
                </p>
              </div>

              <div>
                <label htmlFor="plan-email" className="block text-sm font-medium text-ink">
                  Your email <span className="text-primary">*</span>
                </label>
                <input
                  id="plan-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="mt-2 w-full rounded-xl border border-border-bright bg-white px-4 py-3.5 sm:py-3 text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </>
          ) : null}

          <div>
            <label htmlFor="plan-job" className="block text-sm font-medium text-ink">
              Job you applied for or want to land <span className="text-primary">*</span>
            </label>
            <input
              id="plan-job"
              type="text"
              required
              autoFocus={useLetterProfile}
              value={job}
              onChange={(e) => setJob(e.target.value)}
              placeholder="https://jobs.ashbyhq.com/… or Senior PM at a fintech"
              className="mt-2 w-full rounded-xl border border-border-bright bg-white px-4 py-3.5 sm:py-3 text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="mt-1.5 text-xs text-muted">
              Paste a job URL for the best match, or describe the role.
            </p>
          </div>

          {!useLetterProfile ? (
            <div>
              <label htmlFor="plan-focus" className="block text-sm font-medium text-ink">
                Anything specific <span className="text-muted font-normal">— optional</span>
              </label>
              <textarea
                id="plan-focus"
                rows={3}
                value={focusNote}
                onChange={(e) => setFocusNote(e.target.value)}
                onKeyDown={onFocusKeyDown}
                placeholder="I've applied to 20 jobs and can't seem to land an interview…"
                className="mt-2 w-full resize-y rounded-xl border border-border-bright bg-white px-4 py-3 text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1.5 text-xs text-muted">⌘/Ctrl + Enter to submit</p>
            </div>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-xl bg-primary px-5 py-3.5 font-medium text-white hover:bg-primary-bright transition-colors"
          >
            Build my Game Plan
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          <Link to="/" className="text-primary hover:text-primary-bright underline inline-block py-2">
            ← Back to Field Report
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
