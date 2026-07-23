import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlanSteps } from '../components/plan/PlanSteps'
import { usePlan } from '../data/PlanContext'
import { formatNumber, formatSalary, formatShare } from '../lib/format'
import type { SkillBar } from '../lib/planTypes'

function toneColor(tone: SkillBar['tone']): string {
  if (tone === 'green') return 'bg-emerald-500'
  if (tone === 'amber') return 'bg-amber-500'
  return 'bg-red-500'
}

function toneText(tone: SkillBar['tone']): string {
  if (tone === 'green') return 'text-emerald-700'
  if (tone === 'amber') return 'text-amber-700'
  return 'text-red-600'
}

function Chip({ label, tone }: { label: string; tone: SkillBar['tone'] | 'neutral' | 'primary' }) {
  const cls =
    tone === 'green'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : tone === 'red'
          ? 'border-red-200 bg-red-50 text-red-700'
          : tone === 'primary'
            ? 'border-primary/30 bg-primary/5 text-primary'
            : 'border-border bg-white text-ink/80'
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

function SkillBlock({ bar }: { bar: SkillBar }) {
  return (
    <div className="mt-4 first:mt-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-ink">{bar.title}</span>
        <span className={`text-xs font-semibold ${toneText(bar.tone)}`}>{bar.status}</span>
      </div>
      <div className="mt-2 h-1 w-full rounded-full bg-surface-hover">
        <div
          className={`h-full rounded-full ${toneColor(bar.tone)}`}
          style={{ width: `${bar.width}%` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {bar.chips.map((c) => (
          <Chip key={c} label={c} tone={bar.tone} />
        ))}
      </div>
    </div>
  )
}

export function PlanAnalysisPage() {
  const { plan } = usePlan()
  if (!plan) return <Navigate to="/plan" replace />

  const { analysis } = plan
  const labor = analysis.laborContext
  const hasJob = Boolean(plan.jobDetail && plan.jobDetail !== 'your job description')

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
      <PlanSteps active="analysis" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-4">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary text-white text-sm font-bold">
            ✓
          </span>
          <div>
            <p className="font-medium text-ink">
              {analysis.firstName}&apos;s gap analysis is ready
            </p>
            <p className="mt-1 text-sm text-muted leading-relaxed">{analysis.summary}</p>
          </div>
        </div>

        {labor ? (
          <div className="mt-6 rounded-xl border border-border px-4 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted font-mono">
                  Labor market · {labor.soc}
                </p>
                <p className="mt-1 font-serif text-xl text-ink">{labor.title}</p>
              </div>
              <Link
                to={`/map/${labor.soc}`}
                className="text-sm font-medium text-primary hover:text-primary-bright underline"
              >
                Open Field Report map →
              </Link>
            </div>
            <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <dt className="text-muted text-xs">Entry</dt>
                <dd className="font-medium">{formatSalary(labor.entrySalary)}</dd>
              </div>
              <div>
                <dt className="text-muted text-xs">Median</dt>
                <dd className="font-medium">{formatSalary(labor.medianSalary)}</dd>
              </div>
              <div>
                <dt className="text-muted text-xs">Openings</dt>
                <dd className="font-medium">{formatNumber(labor.openPositions)}</dd>
              </div>
              <div>
                <dt className="text-muted text-xs">AI / competition</dt>
                <dd className="font-medium">
                  {labor.aiDisruptionLabel ?? '—'}
                  {labor.competitionLevel ? ` · ${labor.competitionLevel}` : ''}
                  {labor.karpathyExposure != null
                    ? ` · ${formatShare(labor.karpathyExposure)}`
                    : ''}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-5">
            <h2 className="font-serif text-lg text-ink">What you already bring</h2>
            {analysis.strengths.map((s) => (
              <SkillBlock key={s.title} bar={s} />
            ))}
          </div>
          <div className="rounded-xl border border-border p-5">
            <h2 className="font-serif text-lg text-ink">Where you&apos;re still growing</h2>
            {analysis.gaps.map((g) => (
              <SkillBlock key={g.title} bar={g} />
            ))}
          </div>
        </div>

        {!hasJob || analysis.roleSuggestions.length > 0 ? (
          <div className="mt-6 rounded-xl border-2 border-primary/40 p-5">
            <h2 className="font-serif text-lg text-ink">Roles where your strengths already land</h2>
            <p className="mt-1 text-sm text-muted">
              These may be an easier first step or a stronger match right now.
            </p>
            <ul className="mt-4 space-y-3">
              {analysis.roleSuggestions.map((r) => (
                <li
                  key={r.title}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${
                    r.highlight
                      ? 'border-emerald-300 bg-emerald-50/50'
                      : 'border-border bg-white'
                  }`}
                >
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full border-2 border-primary text-xs font-bold text-primary">
                    {r.match}%
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{r.title}</p>
                    <p className="text-sm text-muted">{r.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <h2 className="mt-10 font-serif text-xl text-ink">What do you want to do next?</h2>

        <Link
          to="/plan/roadmap"
          className="mt-4 block rounded-xl border-2 border-emerald-400 p-5 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-medium text-ink">Get my roadmap</h3>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
              Start here
            </span>
          </div>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            A personalized step-by-step plan to close your gaps — self-guided and built around
            your profile.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip label="instant" tone="green" />
            <Chip label="self-guided" tone="green" />
            <Chip label="personalized" tone="green" />
          </div>
        </Link>

        <Link
          to={`/plan/waitlist?email=${encodeURIComponent(plan.email)}`}
          className="mt-4 block rounded-xl border-2 border-primary/50 p-5 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-medium text-ink">Join the October cohort waitlist</h3>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              Free
            </span>
          </div>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            10 weeks, mentor + peers, applications reviewed. Cohorts open October — add yourself
            to the list.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip label="mentor-led" tone="primary" />
            <Chip label="peer cohort" tone="primary" />
            <Chip label="October" tone="primary" />
          </div>
        </Link>

        <div className="mt-4 rounded-xl border border-border p-5">
          <h3 className="text-lg font-medium text-ink">Just send me The Letter</h3>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            You&apos;re already enrolled — weekly AI career intelligence tailored to your path.
            No extra commitment.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
