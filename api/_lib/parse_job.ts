export type ParsedJob = {
  /** Detail line for the "Analyzing the job" step, e.g. "Product Manager · Stripe · San Francisco" */
  detail: string
  /** Company/subject used in the subtitle, e.g. "Stripe" */
  subject: string
  /** Best-effort role title extracted from URL or text */
  title: string | null
}

const FALLBACK = 'your job description'
const URL_DETAIL_FALLBACK = 'Reading your job description'

function titleCase(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ')
}

function isSlug(segment: string): boolean {
  return (
    /[a-z]/i.test(segment) &&
    segment.includes('-') &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i.test(segment) &&
    !/^\d+$/.test(segment)
  )
}

function parseUrl(raw: string): ParsedJob {
  let url: URL
  try {
    url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
  } catch {
    return { detail: FALLBACK, subject: FALLBACK, title: null }
  }

  const host = url.hostname.replace(/^www\./, '')
  const segments = url.pathname.split('/').filter(Boolean)

  let company: string | null = null
  let title: string | null = null
  let location: string | null = null

  if (
    host.includes('ashbyhq.com') ||
    host.includes('greenhouse.io') ||
    host.includes('lever.co')
  ) {
    company = segments[0] ?? null
    title = segments.find((segment, index) => index > 0 && isSlug(segment)) ?? null
  } else if (host.includes('myworkdayjobs.com')) {
    company = url.hostname.split('.')[0] ?? null
    const slug = segments.find(isSlug)
    title = slug ? slug.replace(/_R-?\d+$/i, '') : null
  } else if (host.includes('linkedin.com')) {
    const slug = segments
      .filter((segment) => isSlug(segment) && segment !== 'jobs' && segment !== 'view')
      .sort((a, b) => b.length - a.length)[0]

    if (slug) {
      const withoutId = slug.replace(/-\d{5,}$/i, '')
      const atMatch = withoutId.match(/^(.*?)-at-(.*)$/i)
      if (atMatch) {
        title = atMatch[1] || null
        company = atMatch[2] || null
      } else {
        title = withoutId || null
      }
    }
  } else if (host.includes('indeed.')) {
    company = null
    title = null
  } else {
    const parts = host.split('.')
    company = parts.length >= 2 ? parts[parts.length - 2] : parts[0]
    title = segments.find(isSlug) ?? null
  }

  const locationParam = url.searchParams.get('location') ?? url.searchParams.get('loc')
  if (locationParam) location = locationParam

  const cleanCompany = company ? titleCase(decodeURIComponent(company)) : null
  const cleanTitle = title ? titleCase(decodeURIComponent(title)) : null
  const cleanLocation = location ? titleCase(decodeURIComponent(location)) : null

  const detailParts = [cleanTitle, cleanCompany, cleanLocation].filter(Boolean)
  const detail = detailParts.length > 0 ? detailParts.join(' · ') : URL_DETAIL_FALLBACK
  const subject = cleanCompany || cleanTitle || FALLBACK

  return { detail, subject, title: cleanTitle }
}

function parseText(raw: string): ParsedJob {
  const detail = raw.trim()
  const atMatch = raw.match(/^(.*?)\s+at\s+(.+)$/i)
  if (atMatch) {
    const title = atMatch[1].trim()
    const company = atMatch[2].trim().replace(/[.\s]+$/, '')
    return {
      detail,
      subject: company || FALLBACK,
      title: title || null,
    }
  }
  return { detail: detail || FALLBACK, subject: FALLBACK, title: detail || null }
}

export function parseJob(input: string | undefined | null): ParsedJob {
  const raw = (input ?? '').trim()
  if (!raw) return { detail: FALLBACK, subject: FALLBACK, title: null }

  const looksLikeUrl =
    /^https?:\/\//i.test(raw) ||
    /^[\w-]+(\.[\w-]+)+\//.test(raw) ||
    /^[\w-]+\.(com|io|co|org|net|jobs)\b/i.test(raw)

  return looksLikeUrl ? parseUrl(raw) : parseText(raw)
}
