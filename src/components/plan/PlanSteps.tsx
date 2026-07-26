import { Link } from 'react-router-dom'

export function PlanSteps({
  active,
}: {
  active: 'connect' | 'building' | 'analysis' | 'roadmap'
}) {
  const steps: { id: typeof active; label: string; to?: string }[] = [
    { id: 'connect', label: 'Connect', to: '/plan' },
    { id: 'building', label: 'Building' },
    { id: 'analysis', label: 'Analysis', to: '/plan/analysis' },
    { id: 'roadmap', label: 'Roadmap', to: '/plan/roadmap' },
  ]
  const order = ['connect', 'building', 'analysis', 'roadmap'] as const
  const activeIdx = order.indexOf(active)

  return (
    <ol className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 sm:gap-5 overflow-x-auto overscroll-x-contain border-b border-border pb-4 mb-6 sm:mb-8 scrollbar-none">
      {steps.map((step, i) => {
        const done = i < activeIdx
        const current = i === activeIdx
        const inner = (
          <span className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                done || current
                  ? 'bg-primary text-white'
                  : 'border border-border-bright text-muted'
              }`}
            >
              {done ? '✓' : i + 1}
            </span>
            <span
              className={`text-xs sm:text-sm font-medium ${
                current ? 'text-ink' : done ? 'text-ink/70' : 'text-muted'
              }`}
            >
              {step.label}
            </span>
          </span>
        )
        return (
          <li key={step.id} className="shrink-0">
            {step.to && (done || current) ? (
              <Link to={step.to} className="hover:opacity-80 inline-flex min-h-11 sm:min-h-0 items-center">
                {inner}
              </Link>
            ) : (
              <span className="inline-flex min-h-11 sm:min-h-0 items-center">{inner}</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
