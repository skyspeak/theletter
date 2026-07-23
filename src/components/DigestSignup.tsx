import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PLAN_EMAIL_KEY } from '../lib/planTypes'

export type DigestSignupProps = {
  industry?: string
  role?: string
  focusAreas?: string[]
  sourceRef?: string
}

type Status = 'idle' | 'sending' | 'sent' | 'skipped' | 'error'

export function DigestSignup({
  industry,
  role,
  focusAreas,
  sourceRef,
}: DigestSignupProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          industry: industry ?? null,
          role: role ?? null,
          focusAreas: focusAreas ?? null,
          sourceRef: sourceRef ?? null,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        skipped?: string
        ok?: boolean
      }
      if (!res.ok) throw new Error(data.error ?? `request failed (${res.status})`)
      try {
        sessionStorage.setItem(PLAN_EMAIL_KEY, email.trim().toLowerCase())
      } catch {
        /* ignore */
      }
      setStatus(data.skipped === 'already_enrolled' ? 'skipped' : 'sent')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
      className="mt-12 pt-4"
    >
      {status === 'sent' || status === 'skipped' ? (
        <div
          role="status"
          className="max-w-lg mx-auto rounded-xl border border-border bg-surface px-5 py-4 text-ink"
        >
          <p className="font-medium">
            {status === 'skipped' ? "You're already on the list." : "You're in."}
          </p>
          <p className="mt-1 text-sm text-muted">
            Check <span className="text-ink">{email}</span> — Sundays at 14:00 UTC.
          </p>
          <Link
            to="/plan"
            className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-bright"
          >
            Build your Game Plan →
          </Link>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
        >
          <label className="sr-only" htmlFor="letter-email">
            Email
          </label>
          <input
            id="letter-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu"
            disabled={status === 'sending'}
            className="flex-1 rounded-xl border border-border-bright bg-white px-4 py-3 text-base text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="shrink-0 rounded-xl bg-primary px-5 py-3 font-medium text-white hover:bg-primary-bright disabled:opacity-50"
          >
            {status === 'sending' ? 'Sending…' : 'Send my first letter'}
          </button>
        </form>
      )}
      {status === 'error' && (
        <p role="alert" className="mt-3 text-center text-sm text-red-600">
          {errorMsg}
        </p>
      )}
      {status === 'idle' && (
        <p className="mt-3 text-center text-xs text-muted">One-click unsubscribe.</p>
      )}
    </motion.section>
  )
}
