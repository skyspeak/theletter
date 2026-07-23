import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PLAN_EMAIL_KEY } from '../lib/planTypes'

export function PlanWaitlistPage() {
  const [params] = useSearchParams()
  const emailParam = params.get('email') ?? ''
  const [email, setEmail] = useState(emailParam)
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (emailParam) return
    try {
      const stored = sessionStorage.getItem(PLAN_EMAIL_KEY)
      if (stored) setEmail(stored)
    } catch {
      /* ignore */
    }
  }, [emailParam])

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

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-10 sm:py-14">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
          {status === 'done' ? '✓' : status === 'error' ? '!' : '…'}
        </span>
        <h1 className="mt-6 font-serif text-3xl text-ink tracking-tight">
          {status === 'done'
            ? "You're on the waitlist."
            : status === 'error'
              ? 'Could not join waitlist'
              : 'Joining the waitlist…'}
        </h1>
        <p className="mt-2 text-muted leading-relaxed max-w-md mx-auto">
          {status === 'done'
            ? 'Applications open in August. We’ll review and confirm your spot then.'
            : status === 'error'
              ? error
              : `Saving ${email || 'your email'}…`}
        </p>
      </motion.div>

      {status === 'done' ? (
        <div className="mt-10 rounded-xl border border-border p-5 text-left">
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
          className="rounded-xl border border-border-bright px-5 py-3 text-center font-medium text-ink hover:bg-surface"
        >
          ← Back to analysis
        </Link>
        <Link
          to="/"
          className="rounded-xl bg-primary px-5 py-3 text-center font-medium text-white hover:bg-primary-bright"
        >
          Field Report
        </Link>
      </div>
    </div>
  )
}
