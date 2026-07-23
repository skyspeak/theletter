import type { VercelRequest } from '@vercel/node'
import { timingSafeEqual } from 'node:crypto'

/** Authorize Vercel Cron or manual Bearer CRON_SECRET. */
export function isCronAuthorized(req: VercelRequest): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return false

  const auth = req.headers.authorization
  if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) return false

  const got = auth.slice('Bearer '.length)
  try {
    const a = Buffer.from(got)
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}
