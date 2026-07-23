// GET /api/cron/newsletter — Sunday weekly send (Vercel Cron)
// Auth: Authorization: Bearer <CRON_SECRET>
// Controls: dryRun=1, force=1, limit=N, email=...

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isCronAuthorized } from '../_lib/cron_auth.js'
import { sendWeeklyNewsletter } from '../_lib/weekly.js'

export const config = { maxDuration: 300 }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }

  if (!isCronAuthorized(req)) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }

  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: 'DATABASE_URL not configured' })
    return
  }

  const q = req.query
  const dryRun = q.dryRun === '1' || q.dryRun === 'true'
  const force = q.force === '1' || q.force === 'true'
  const limitRaw = typeof q.limit === 'string' ? Number(q.limit) : undefined
  const limit = limitRaw && Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : undefined
  const email = typeof q.email === 'string' ? q.email : undefined

  try {
    const result = await sendWeeklyNewsletter({ dryRun, force, limit, email })
    res.status(200).json({ ok: true, ...result })
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : 'newsletter send failed',
    })
  }
}
