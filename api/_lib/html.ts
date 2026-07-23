export function baseUrl(): string {
  const fromEnv = process.env.BASE_URL?.replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:5174'
}

export function fieldReportUrl(): string {
  return (
    process.env.FIELD_REPORT_URL?.replace(/\/$/, '') ||
    process.env.VITE_FIELD_REPORT_URL?.replace(/\/$/, '') ||
    'https://skyspeak.github.io/fieldreport'
  )
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Allow Field Report (and local) origins to POST /api/subscribe */
export function applyCors(
  req: { headers?: { origin?: string } },
  res: { setHeader: (k: string, v: string) => void },
): void {
  const origin = req.headers?.origin
  const allowed = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const defaults = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    fieldReportUrl(),
  ]
  const list = [...new Set([...defaults, ...allowed])]
  if (origin && list.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Vary', 'Origin')
  }
}
