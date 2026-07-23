// POST /api/plan/analyze — build + persist a Game Plan

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { analyzeGamePlan } from '../_lib/plan.js'

export const config = { maxDuration: 60 }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {})
    const result = await analyzeGamePlan({
      email: typeof body.email === 'string' ? body.email : '',
      jobInput: typeof body.jobInput === 'string' ? body.jobInput : '',
      linkedinUrl: typeof body.linkedinUrl === 'string' ? body.linkedinUrl : null,
      focusNote: typeof body.focusNote === 'string' ? body.focusNote : null,
      fromLetter: Boolean(body.fromLetter),
      token: typeof body.token === 'string' ? body.token : null,
      name: typeof body.name === 'string' ? body.name : null,
      role: typeof body.role === 'string' ? body.role : null,
      industry: typeof body.industry === 'string' ? body.industry : null,
      focusAreas: Array.isArray(body.focusAreas) ? body.focusAreas : null,
      sourceRef: typeof body.sourceRef === 'string' ? body.sourceRef : null,
    })

    if (!result.ok) {
      res.status(result.status).json({ error: result.error })
      return
    }

    res.status(200).json({ ok: true, plan: result.plan })
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : 'analyze failed',
    })
  }
}
