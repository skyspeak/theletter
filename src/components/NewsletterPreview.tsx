import { motion } from 'framer-motion'

/** Sample curated-issue preview — loops like a product GIF for conversion. */
export function NewsletterPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.12 }}
      className="mt-8 sm:mt-10 mx-auto max-w-md"
      aria-hidden
    >
      <p className="mb-3 text-center text-xs font-mono uppercase tracking-[0.08em] text-muted">
        Sample Sunday issue
      </p>

      <div className="relative overflow-hidden rounded-2xl border border-border-bright bg-white shadow-[0_18px_50px_-28px_rgba(20,20,20,0.35)]">
        {/* Email chrome */}
        <div className="border-b border-border px-4 py-3 bg-surface/80">
          <div className="flex items-center gap-2 text-[11px] text-muted font-mono">
            <span className="inline-block h-2 w-2 rounded-full bg-primary/80" />
            <span>dear[CC] The Letter</span>
            <span className="ml-auto">Weekly · 12 min</span>
          </div>
        </div>

        {/* Viewport — content scrolls on a loop */}
        <div className="relative h-[280px] sm:h-[320px] overflow-hidden bg-white">
          <div className="newsletter-preview-scroll px-5 py-4 will-change-transform">
            <div className="font-serif text-[15px] font-medium text-ink">
              dear<span className="text-primary">[</span>
              <span className="text-primary">CC</span>
              <span className="text-primary">]</span> The Letter
            </div>
            <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.08em] text-muted">
              From the newsletters
            </p>
            <h3 className="mt-2 font-serif text-lg leading-snug text-ink">
              Agents that ship — without shipping your judgment
            </h3>
            <p className="mt-1 text-[11px] text-muted font-mono">latent.space</p>
            <div className="mt-3 rounded-r-md border-l-[3px] border-primary bg-[#fdf2ee] px-3 py-2 text-[12px] leading-relaxed text-ink">
              <span className="font-semibold">Why it&apos;s relevant:</span> If you&apos;re a
              founder, this is the difference between “AI theater” and a workflow you can
              actually trust on Monday.
            </div>
            <p className="mt-3 text-[10px] font-mono uppercase tracking-[0.08em] text-muted">
              What it says
            </p>
            <ul className="mt-1 space-y-1.5 pl-4 text-[12px] leading-relaxed text-ink list-disc">
              <li>Teams keep humans on taste, models on drafts.</li>
              <li>Eval harnesses beat prompt folklore for shipping.</li>
              <li>Cost curves favor small, repeated tasks first.</li>
            </ul>
            <div className="mt-3 rounded-r-md border-l-[3px] border-border-bright bg-surface px-3 py-2 text-[12px] leading-relaxed text-ink">
              <span className="font-semibold">What to do:</span> Pick one weekly report you
              write by hand — draft it with AI, then only edit the judgment calls.
            </div>

            <hr className="my-5 border-border" />
            <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted">
              Big AI news this week
            </p>
            <h3 className="mt-2 font-serif text-base leading-snug text-ink">
              Lab launches crowd the feed — here&apos;s the one that matters
            </h3>
            <p className="mt-1 text-[11px] text-muted font-mono">theverge.com</p>
            <div className="mt-3 rounded-r-md border-l-[3px] border-primary bg-[#fdf2ee] px-3 py-2 text-[12px] leading-relaxed text-ink">
              <span className="font-semibold">Why it&apos;s relevant:</span> Pricing and
              context windows change what you can automate for a Technology team this
              quarter — not next year.
            </div>

            <hr className="my-5 border-border" />
            <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted">
              For your role
            </p>
            <h3 className="mt-2 font-serif text-base leading-snug text-ink">
              A playbook for shipping AI features without a research lab
            </h3>
            <ul className="mt-2 space-y-1.5 pl-4 text-[12px] leading-relaxed text-ink list-disc">
              <li>Start with internal tools, not customer-facing bets.</li>
              <li>Measure time saved, not “AI adoption” vanity metrics.</li>
            </ul>

            <hr className="my-5 border-border" />
            <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-muted">
              Build this week
            </p>
            <h3 className="mt-2 font-serif text-base leading-snug text-ink">
              30-minute competitor brief with ChatGPT + Notion
            </h3>
            <p className="mt-2 text-[12px] leading-relaxed text-ink/80">
              Pasteable prompts, no terminal — designed for technicalLevel “some”.
            </p>

            {/* Duplicate block so the loop seams cleanly */}
            <div className="mt-8 pt-2 opacity-90" aria-hidden>
              <div className="font-serif text-[15px] font-medium text-ink">
                dear<span className="text-primary">[</span>
                <span className="text-primary">CC</span>
                <span className="text-primary">]</span> The Letter
              </div>
              <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.08em] text-muted">
                From the newsletters
              </p>
              <h3 className="mt-2 font-serif text-lg leading-snug text-ink">
                Agents that ship — without shipping your judgment
              </h3>
            </div>
          </div>

          {/* Edge fades */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
        </div>
      </div>
    </motion.div>
  )
}
