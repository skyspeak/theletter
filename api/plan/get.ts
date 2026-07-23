// GET /api/plan/get?id=<gamePlanId>

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getGamePlanById } from '../_lib/plan.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }

  try {
    const id = typeof req.query.id === 'string' ? req.query.id : ''
    const result = await getGamePlanById(id)
    if (!result.ok) {
      res.status(result.status).json({ error: result.error })
      return
    }
    res.status(200).json({ ok: true, plan: result.plan })
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : 'lookup failed',
    })
  }
}
