// POST /api/plan/waitlist — join October cohort waitlist

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { joinCohortWaitlist } from '../_lib/plan.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {})
    const result = await joinCohortWaitlist(
      typeof body.email === 'string' ? body.email : '',
    )
    if (!result.ok) {
      res.status(result.status).json({ error: result.error })
      return
    }
    res.status(200).json({ ok: true, email: result.email })
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : 'waitlist failed',
    })
  }
}
