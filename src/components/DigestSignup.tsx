import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PLAN_EMAIL_KEY, PLAN_LINKEDIN_KEY } from '../lib/planTypes'
import { useEnterAction } from '../lib/useEnterAction'

export type DigestSignupProps = {
  industry?: string
  role?: string
  focusAreas?: string[]
  sourceRef?: string
}

type Step = 'email' | 'profile' | 'done'
type Status = 'idle' | 'sending' | 'error'

const DONT_KNOW = "Don't know yet"
const WRITE_OWN = 'Write your own'

const INDUSTRY_OPTIONS = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Consulting',
  'Media & marketing',
] as const

const ROLE_OPTIONS = [
  'Software engineer',
  'Product manager',
  'Data analyst',
  'Designer',
  'Founder',
] as const

const fieldClass =
  'w-full rounded-xl border border-border-bright bg-white px-4 py-3 text-base text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60'

const customFieldClass =
  'w-full rounded-lg border border-border-bright bg-white px-3 py-2.5 text-base text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60'

function tagClass(selected: boolean) {
  return [
    'rounded-lg border px-3 py-2.5 sm:py-1.5 text-sm transition-colors min-h-11 sm:min-h-0',
    selected
      ? 'border-primary bg-primary/10 text-ink'
      : 'border-border-bright bg-white text-muted hover:border-primary/40 hover:text-ink',
  ].join(' ')
}

type TagMultiProps = {
  label: string
  options: readonly string[]
  selected: string[]
  custom: string
  onChange: (next: string[], custom: string) => void
  disabled?: boolean
  customPlaceholder: string
}

function TagMulti({
  label,
  options,
  selected,
  custom,
  onChange,
  disabled,
  customPlaceholder,
}: TagMultiProps) {
  const writeOwnOn = selected.includes(WRITE_OWN)
  const dontKnowOn = selected.includes(DONT_KNOW)
  const customRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!writeOwnOn) return
    customRef.current?.focus()
  }, [writeOwnOn])

  function toggle(option: string) {
    if (disabled) return
    if (option === DONT_KNOW) {
      onChange(dontKnowOn ? [] : [DONT_KNOW], '')
      return
    }
    if (option === WRITE_OWN) {
      if (writeOwnOn) {
        onChange(
          selected.filter((s) => s !== WRITE_OWN),
          '',
        )
      } else {
        onChange(
          [...selected.filter((s) => s !== DONT_KNOW), WRITE_OWN],
          custom,
        )
      }
      return
    }
    const withoutMeta = selected.filter((s) => s !== DONT_KNOW)
    if (withoutMeta.includes(option)) {
      onChange(
        withoutMeta.filter((s) => s !== option),
        custom,
      )
    } else {
      onChange([...withoutMeta, option], custom)
    }
  }

  function onTagKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <div>
      <p className="mb-2.5 text-base sm:text-lg font-medium text-ink">{label}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            aria-pressed={selected.includes(opt)}
            onClick={() => toggle(opt)}
            onKeyDown={onTagKeyDown}
            className={tagClass(selected.includes(opt))}
          >
            {opt}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          aria-pressed={writeOwnOn}
          onClick={() => toggle(WRITE_OWN)}
          onKeyDown={onTagKeyDown}
          className={tagClass(writeOwnOn)}
        >
          {WRITE_OWN}
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-pressed={dontKnowOn}
          onClick={() => toggle(DONT_KNOW)}
          onKeyDown={onTagKeyDown}
          className={tagClass(dontKnowOn)}
        >
          {DONT_KNOW}
        </button>
      </div>
      {writeOwnOn ? (
        <input
          ref={customRef}
          type="text"
          value={custom}
          onChange={(e) => onChange(selected, e.target.value)}
          placeholder={customPlaceholder}
          disabled={disabled}
          className={`${customFieldClass} mt-2`}
        />
      ) : null}
    </div>
  )
}

function resolveSelection(selected: string[], custom: string): string | null {
  if (selected.includes(DONT_KNOW)) return DONT_KNOW
  const tags = selected.filter((s) => s !== WRITE_OWN && s !== DONT_KNOW)
  const own = selected.includes(WRITE_OWN) ? custom.trim() : ''
  const parts = [...tags, ...(own ? [own] : [])]
  if (!parts.length) return null
  return parts.join(', ')
}

function seedFromProp(prop: string | undefined, options: readonly string[]) {
  if (!prop?.trim()) return [] as string[]
  const t = prop.trim()
  // Only preselect exact known tags — never open "Write your own" from props
  return (options as readonly string[]).includes(t) ? [t] : []
}

export function DigestSignup({
  industry: industryProp,
  role: roleProp,
  focusAreas,
  sourceRef,
}: DigestSignupProps) {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [industries, setIndustries] = useState<string[]>(() =>
    seedFromProp(industryProp, INDUSTRY_OPTIONS),
  )
  const [industryCustom, setIndustryCustom] = useState('')
  const [roles, setRoles] = useState<string[]>(() => seedFromProp(roleProp, ROLE_OPTIONS))
  const [roleCustom, setRoleCustom] = useState('')

  const goToPlan = useCallback(() => {
    const qs = new URLSearchParams()
    if (email.trim()) qs.set('email', email.trim())
    if (linkedinUrl.trim()) qs.set('linkedin', linkedinUrl.trim())
    qs.set('from', 'letter')
    const s = qs.toString()
    navigate(s ? `/plan?${s}` : '/plan')
  }, [email, linkedinUrl, navigate])
  useEnterAction(goToPlan, step === 'done')

  async function postSubscribe(body: Record<string, unknown>) {
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await res.json().catch(() => ({}))) as {
      error?: string
      skipped?: string
      ok?: boolean
    }
    if (!res.ok) throw new Error(data.error ?? `request failed (${res.status})`)
    return data
  }

  async function onEmailSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    setErrorMsg(null)
    try {
      await postSubscribe({
        email: email.trim(),
        focusAreas: focusAreas ?? null,
        sourceRef: sourceRef ?? null,
      })
      try {
        sessionStorage.setItem(PLAN_EMAIL_KEY, email.trim().toLowerCase())
      } catch {
        /* ignore */
      }
      setStatus('idle')
      setStep('profile')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  async function onProfileSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    const industry = resolveSelection(industries, industryCustom)
    const role = resolveSelection(roles, roleCustom)
    if (!industry || !role) {
      setStatus('error')
      setErrorMsg('Pick at least one industry and one role (or Don’t know yet).')
      return
    }
    setStatus('sending')
    setErrorMsg(null)
    try {
      await postSubscribe({
        email: email.trim(),
        linkedinUrl: linkedinUrl.trim() || null,
        industry,
        role,
        sourceRef: sourceRef ?? null,
      })
      try {
        sessionStorage.setItem(PLAN_EMAIL_KEY, email.trim().toLowerCase())
        if (linkedinUrl.trim()) {
          sessionStorage.setItem(PLAN_LINKEDIN_KEY, linkedinUrl.trim())
        }
      } catch {
        /* ignore */
      }
      setStatus('idle')
      setStep('done')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  function skipProfile() {
    setStep('done')
  }

  const planHandoffQs = (() => {
    const qs = new URLSearchParams()
    if (email.trim()) qs.set('email', email.trim())
    if (linkedinUrl.trim()) qs.set('linkedin', linkedinUrl.trim())
    qs.set('from', 'letter')
    const s = qs.toString()
    return s ? `?${s}` : ''
  })()

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
      className="mt-4"
    >
      <AnimatePresence mode="wait">
        {step === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <form
              onSubmit={onEmailSubmit}
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
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                disabled={status === 'sending'}
                className={`${fieldClass} flex-1 min-w-0`}
              />
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full sm:w-auto shrink-0 rounded-xl bg-primary px-5 py-3.5 sm:py-3 font-medium text-white hover:bg-primary-bright disabled:opacity-50"
              >
                {status === 'sending' ? 'Sending…' : 'Send my first letter'}
              </button>
            </form>
            <p className="mt-3 text-center text-xs text-muted">One-click unsubscribe.</p>
          </motion.div>
        )}

        {step === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="max-w-lg mx-auto"
          >
            <div className="mb-5 text-center">
              <p className="text-xl sm:text-2xl text-ink/70 font-light leading-snug">
                Take <strong className="text-ink font-semibold">5 seconds</strong> to
                personalize this for you
              </p>
            </div>
            <hr className="mb-5 border-0 border-t border-border" />
            <form onSubmit={onProfileSubmit} className="flex flex-col gap-5">
              <TagMulti
                label="Preferred industries"
                options={INDUSTRY_OPTIONS}
                selected={industries}
                custom={industryCustom}
                disabled={status === 'sending'}
                customPlaceholder="Type your industry"
                onChange={(next, custom) => {
                  setIndustries(next)
                  setIndustryCustom(custom)
                }}
              />
              <TagMulti
                label="Preferred roles"
                options={ROLE_OPTIONS}
                selected={roles}
                custom={roleCustom}
                disabled={status === 'sending'}
                customPlaceholder="Type your role"
                onChange={(next, custom) => {
                  setRoles(next)
                  setRoleCustom(custom)
                }}
              />
              <div>
                <label
                  htmlFor="letter-linkedin"
                  className="mb-2.5 block text-base sm:text-lg font-medium text-ink"
                >
                  LinkedIn
                </label>
                <input
                  id="letter-linkedin"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/you"
                  disabled={status === 'sending'}
                  className={fieldClass}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full sm:w-auto rounded-xl bg-primary px-5 py-3.5 sm:py-3 font-medium text-white hover:bg-primary-bright disabled:opacity-50"
                >
                  {status === 'sending' ? 'Saving…' : 'Personalize my letter'}
                </button>
                <button
                  type="button"
                  onClick={skipProfile}
                  disabled={status === 'sending'}
                  className="w-full sm:w-auto rounded-xl px-4 py-3 text-sm text-muted hover:text-ink"
                >
                  Nevermind, I don't want to personalize
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            role="status"
            className="max-w-lg mx-auto rounded-xl border border-border bg-surface px-5 py-4 text-ink"
          >
            <p className="font-medium">You’re set.</p>
            <p className="mt-1 text-sm text-muted">
              Check <span className="text-ink">{email}</span> — Sundays at 14:00 UTC.
            </p>
            <Link
              to={`/plan${planHandoffQs}`}
              className="mt-4 inline-flex w-full sm:w-auto justify-center rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary-bright"
            >
              Build your Game Plan →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {status === 'error' && (
        <p role="alert" className="mt-3 text-center text-sm text-red-600">
          {errorMsg}
        </p>
      )}
    </motion.section>
  )
}
