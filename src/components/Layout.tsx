import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { BrandMark } from './BrandMark'

export function Layout({ children }: { children: ReactNode }) {
  const fieldReportUrl = (
    import.meta.env.VITE_FIELD_REPORT_URL as string | undefined
  )?.replace(/\/$/, '')

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-4">
          <Link to="/" className="no-underline shrink-0">
            <BrandMark size="sm" />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/plan" className="text-muted hover:text-ink">
              Game Plan
            </Link>
            {fieldReportUrl && (
              <a href={fieldReportUrl} className="text-muted hover:text-ink">
                Field Report
              </a>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 min-w-0">{children}</main>
      <footer className="border-t border-border mt-auto bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 text-sm">
          <p className="font-serif text-ink/70">
            © {new Date().getFullYear()} dear[CC] The Letter
          </p>
          <p className="text-muted mt-2 text-xs sm:text-sm max-w-xl leading-relaxed">
            Weekly AI + career notes. One-click unsubscribe in every email.
          </p>
        </div>
      </footer>
    </div>
  )
}
