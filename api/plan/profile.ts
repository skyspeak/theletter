// GET /api/plan/profile?t=<unsubscribeToken>

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPlanProfile } from '../_lib/plan.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }

  try {
    const t = typeof req.query.t === 'string' ? req.query.t : ''
    const result = await getPlanProfile(t)
    if (!result.ok) {
      res.status(result.status).json({ error: result.error })
      return
    }
    res.status(200).json(result)
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : 'profile lookup failed',
    })
  }
}
