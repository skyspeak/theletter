import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PLAN_EMAIL_KEY } from '../lib/planTypes'
import { useEnterAction } from '../lib/useEnterAction'

function readStoredEmail(): string {
  try {
    return sessionStorage.getItem(PLAN_EMAIL_KEY) ?? ''
  } catch {
    return ''
  }
}

export function PlanWaitlistPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const emailParam = params.get('email') ?? ''
  const [email, setEmail] = useState(() => emailParam || readStoredEmail())
  const [status, setStatus] = useState<'idle' | 'needs-email' | 'sending' | 'done' | 'error'>(() =>
    emailParam || readStoredEmail() ? 'idle' : 'needs-email',
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam)
      setStatus((s) => (s === 'needs-email' ? 'idle' : s))
      return
    }
    if (email.trim()) return
    const stored = readStoredEmail()
    if (stored) {
      setEmail(stored)
      setStatus('idle')
    }
  }, [emailParam, email])

  useEffect(() => {
    if (!email.trim() || status !== 'idle') return
    let cancelled = false
    ;(async () => {
      setStatus('sending')
      try {
        const res = await fetch('/api/plan/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        })
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        if (!res.ok) throw new Error(data.error ?? 'Waitlist failed')
        if (!cancelled) setStatus('done')
      } catch (e) {
        if (!cancelled) {
          setStatus('error')
          setError(e instanceof Error ? e.message : 'Something went wrong')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [email, status])

  const goHome = useCallback(() => navigate('/'), [navigate])
  useEnterAction(goHome, status === 'done')

  async function onEmailSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setError(null)
    setStatus('idle')
  }

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-8 sm:py-14">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <span className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
          {status === 'done' ? '✓' : status === 'error' || status === 'needs-email' ? '!' : '…'}
        </span>
        <h1 className="mt-6 font-serif text-2xl sm:text-3xl text-ink tracking-tight px-1">
          {status === 'done'
            ? "You're on the waitlist."
            : status === 'error'
              ? 'Could not join waitlist'
              : status === 'needs-email'
                ? 'Join the waitlist'
                : 'Joining the waitlist…'}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted leading-relaxed max-w-md mx-auto px-1">
          {status === 'done'
            ? 'Applications open in August. We’ll review and confirm your spot then.'
            : status === 'error'
              ? error
              : status === 'needs-email'
                ? 'Enter your email to join the October cohort waitlist.'
                : `Saving ${email || 'your email'}…`}
        </p>
      </motion.div>

      {status === 'needs-email' || status === 'error' ? (
        <form onSubmit={onEmailSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <label className="sr-only" htmlFor="waitlist-email">
            Email
          </label>
          <input
            id="waitlist-email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full min-w-0 flex-1 rounded-xl border border-border-bright bg-white px-4 py-3.5 sm:py-3 text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="w-full sm:w-auto shrink-0 rounded-xl bg-primary px-5 py-3.5 sm:py-3 font-medium text-white hover:bg-primary-bright"
          >
            Join waitlist
          </button>
        </form>
      ) : null}

      {status === 'done' ? (
        <div className="mt-10 rounded-xl border border-border p-4 sm:p-5 text-left">
          <h2 className="font-medium text-ink">What you&apos;re applying for</h2>
          <ul className="mt-4 space-y-4 text-sm">
            <li>
              <p className="font-medium text-ink">10-week cohort</p>
              <p className="text-muted">Mentor + peer group, applications reviewed.</p>
            </li>
            <li className="border-t border-border pt-4">
              <p className="font-medium text-ink">October start</p>
              <p className="text-muted">We&apos;ll email you when applications open.</p>
            </li>
            <li className="border-t border-border pt-4">
              <p className="font-medium text-ink">The Letter continues</p>
              <p className="text-muted">Weekly notes while you wait — no extra signup.</p>
            </li>
          </ul>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/plan/analysis"
          className="rounded-xl border border-border-bright px-5 py-3.5 text-center font-medium text-ink hover:bg-surface"
        >
          ← Back to analysis
        </Link>
        <Link
          to="/"
          className="rounded-xl bg-primary px-5 py-3.5 text-center font-medium text-white hover:bg-primary-bright"
        >
          Field Report
        </Link>
      </div>
    </div>
  )
}
