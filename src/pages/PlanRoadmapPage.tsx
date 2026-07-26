import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlanSteps } from '../components/plan/PlanSteps'
import { usePlan } from '../data/PlanContext'
import type { RoadmapMilestone } from '../lib/planTypes'

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }
  return (
    <div className="mt-3 rounded-lg border border-border bg-surface p-3" data-no-enter-action>
      <pre className="whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-ink/80">
        {text}
      </pre>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={onCopy}
          className="min-h-11 sm:min-h-0 rounded-md border border-primary/30 px-3 py-2 sm:px-2.5 sm:py-1 text-xs font-semibold text-primary hover:bg-primary/5"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

function MilestoneCard({ m }: { m: RoadmapMilestone }) {
  const border =
    m.tone === 'primary'
      ? 'border-primary/35 bg-primary/[0.03]'
      : m.tone === 'success'
        ? 'border-emerald-300/60 bg-emerald-50/40'
        : 'border-border bg-white'

  return (
    <li className={`rounded-xl border p-4 ${border}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2.5 min-w-0">
          <span
            className={`mt-0.5 inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
              m.tone === 'primary'
                ? 'bg-primary text-white'
                : m.tone === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'border border-border text-muted'
            }`}
          >
            {m.id}
          </span>
          <h3 className="font-medium text-ink">{m.title}</h3>
        </div>
        {m.badge ? (
          <span className="self-start rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-muted">
            {m.badge}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-muted leading-relaxed">{m.summary}</p>
      {m.bullets?.length ? (
        <ul className="mt-3 space-y-2">
          {m.bullets.map((b) => (
            <li key={b} className="flex gap-2 text-sm text-ink/80 leading-relaxed">
              <span className="text-primary font-bold shrink-0">✓</span>
              <span className="min-w-0">{b}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {m.copyBlock ? <CopyBlock text={m.copyBlock} /> : null}
    </li>
  )
}

export function PlanRoadmapPage() {
  const { plan } = usePlan()
  if (!plan) return <Navigate to="/plan" replace />

  const { roadmap } = plan

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-8 sm:py-14">
      <PlanSteps active="roadmap" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <p className="text-xs uppercase tracking-wider text-primary font-mono font-medium">
          {roadmap.eyebrow}
        </p>
        <h1 className="mt-1 font-serif text-2xl sm:text-3xl text-ink tracking-tight">Your roadmap</h1>
        <p className="mt-2 text-sm text-muted">
          Jump to wherever you are. Each step works on its own.
        </p>

        <ol className="mt-6 space-y-3">
          {roadmap.milestones.map((m) => (
            <MilestoneCard key={m.id} m={m} />
          ))}
        </ol>

        <div className="mt-6 rounded-xl bg-primary/5 border border-primary/20 px-4 py-4 text-sm text-primary leading-relaxed">
          You&apos;re enrolled in <span className="font-semibold">The Letter</span> — weekly AI
          career intelligence while you work.{' '}
          <Link to="/" className="font-semibold underline underline-offset-2 inline-block py-1">
            Back to Field Report
          </Link>
        </div>

        <Link
          to={`/plan/waitlist?email=${encodeURIComponent(plan.email)}`}
          className="mt-4 block text-center text-sm font-medium text-primary hover:text-primary-bright underline py-2"
        >
          Or join the October cohort waitlist →
        </Link>
      </motion.div>
    </div>
  )
}
