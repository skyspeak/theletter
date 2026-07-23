import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlanSteps } from '../components/plan/PlanSteps'
import { parseJob } from '../lib/parseJob'
import { usePlan } from '../data/PlanContext'
import type { PlanResult } from '../lib/planTypes'
import { PLAN_EMAIL_KEY } from '../lib/planTypes'

type StepState = 'done' | 'running' | 'todo'

export function PlanBuildingPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { setPlan } = usePlan()

  const email = params.get('email') ?? ''
  const job = params.get('job') ?? ''
  const linkedin = params.get('linkedin') ?? ''
  const focus = params.get('focus') ?? ''
  const token = params.get('t') ?? ''
  const fromLetter = params.get('from') === 'letter'

  const parsed = parseJob(job)
  const [phase, setPhase] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (!email || !job) {
      navigate('/plan', { replace: true })
      return
    }
    if (started.current) return
    started.current = true

    const timers = [
      window.setTimeout(() => setPhase(1), 400),
      window.setTimeout(() => setPhase(2), 1100),
      window.setTimeout(() => setPhase(3), 2000),
    ]

    ;(async () => {
      try {
        const res = await fetch('/api/plan/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            jobInput: job,
            linkedinUrl: linkedin || null,
            focusNote: focus || null,
            fromLetter,
            token: token || null,
          }),
        })
        const data = (await res.json().catch(() => ({}))) as {
          error?: string
          plan?: PlanResult
        }
        if (!res.ok || !data.plan) {
          throw new Error(data.error ?? `Analyze failed (${res.status})`)
        }
        try {
          sessionStorage.setItem(PLAN_EMAIL_KEY, email.toLowerCase())
        } catch {
          /* ignore */
        }
        setPlan(data.plan)
        setPhase(4)
        window.setTimeout(() => navigate('/plan/analysis', { replace: true }), 600)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      }
    })()

    return () => timers.forEach(clearTimeout)
  }, [email, job, linkedin, focus, token, fromLetter, navigate, setPlan])

  function rowState(index: number): StepState {
    if (error) return index === 0 ? 'done' : 'todo'
    if (phase > index) return 'done'
    if (phase === index) return 'running'
    return 'todo'
  }

  const rows: { title: string; detail: string; index: number }[] = [
    {
      title: 'Reading your profile',
      detail: fromLetter ? 'Letter persona + LinkedIn URL' : linkedin || 'Profile details',
      index: 0,
    },
    {
      title: 'Analyzing the job',
      detail: parsed.detail,
      index: 1,
    },
    {
      title: 'Finding what works',
      detail: phase >= 3 ? 'Strengths identified' : 'Mapping your strengths…',
      index: 2,
    },
    {
      title: '…and what might need work',
      detail: phase >= 4 ? 'Gaps + roadmap ready' : 'Coming up',
      index: 3,
    },
  ]

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-10 sm:py-14">
      <PlanSteps active="building" />

      <div className="flex flex-col items-center text-center">
        {error ? (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 text-2xl">
            !
          </span>
        ) : phase >= 4 ? (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
            ✓
          </span>
        ) : (
          <span
            className="h-16 w-16 animate-spin rounded-full border-4 border-primary/15 border-t-primary"
            role="status"
            aria-label="Building your Game Plan"
          />
        )}

        <h1 className="mt-6 font-serif text-3xl text-ink tracking-tight">
          {error
            ? 'Could not build your plan'
            : phase >= 4
              ? 'Your Game Plan is ready'
              : 'Building your Game Plan…'}
        </h1>
        <p className="mt-2 text-muted">
          {error ? (
            error
          ) : (
            <>
              Mapping your gaps against{' '}
              <span className="font-medium text-primary">{parsed.subject}</span>
            </>
          )}
        </p>
      </div>

      <ul className="mt-10 divide-y divide-border">
        {rows.map((row) => {
          const state = rowState(row.index)
          return (
            <li key={row.title} className="flex items-start gap-3 py-4">
              <span
                className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-bold ${
                  state === 'done'
                    ? 'bg-primary/10 text-primary'
                    : state === 'running'
                      ? 'bg-primary/10 text-primary'
                      : 'border border-border text-muted'
                }`}
              >
                {state === 'done' ? '✓' : state === 'running' ? '…' : '·'}
              </span>
              <div className="min-w-0 flex-1 text-left">
                <p
                  className={`text-[15px] font-medium ${
                    state === 'todo' ? 'text-muted' : 'text-ink'
                  }`}
                >
                  {row.title}
                </p>
                <p
                  className={`mt-0.5 text-sm ${
                    state === 'running' ? 'text-primary' : 'text-muted'
                  }`}
                >
                  {row.detail}
                </p>
              </div>
              <span
                className={`text-sm font-medium ${
                  state === 'done'
                    ? 'text-primary'
                    : state === 'running'
                      ? 'text-primary'
                      : 'text-muted'
                }`}
              >
                {state === 'done' ? 'Done' : state === 'running' ? 'Running' : 'Up next'}
              </span>
            </li>
          )
        })}
      </ul>

      {error ? (
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            to="/plan"
            className="rounded-xl bg-primary px-5 py-3 text-center font-medium text-white hover:bg-primary-bright"
          >
            Try again
          </Link>
          <Link
            to="/"
            className="rounded-xl border border-border-bright px-5 py-3 text-center font-medium text-ink hover:bg-surface"
          >
            Back to Field Report
          </Link>
        </div>
      ) : null}

      {!error && phase >= 4 ? (
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => navigate('/plan/analysis')}
          className="mt-8 w-full rounded-xl bg-primary px-5 py-3.5 font-medium text-white hover:bg-primary-bright"
        >
          See my Game Plan →
        </motion.button>
      ) : null}
    </div>
  )
}
