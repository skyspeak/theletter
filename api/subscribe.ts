// POST /api/subscribe — enroll in dear[CC] The Letter + welcome email

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { enrollSubscriber } from './_lib/enroll.js'
import { applyCors } from './_lib/html.js'

export const config = { maxDuration: 60 }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res)
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {})
    const result = await enrollSubscriber({
      email: typeof body.email === 'string' ? body.email : '',
      industry: typeof body.industry === 'string' ? body.industry : null,
      role: typeof body.role === 'string' ? body.role : null,
      name: typeof body.name === 'string' ? body.name : null,
      focusAreas: Array.isArray(body.focusAreas) ? body.focusAreas : null,
      sourceRef: typeof body.sourceRef === 'string' ? body.sourceRef : null,
    })

    if (!result.ok) {
      res.status(result.status).json({ error: result.error })
      return
    }

    if ('skipped' in result) {
      res.status(200).json({ ok: true, skipped: result.skipped })
      return
    }

    res.status(200).json({ ok: true, welcomeSent: result.welcomeSent })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'enrollment failed'
    res.status(500).json({ error: message })
  }
}
