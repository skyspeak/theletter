// GET /api/test-letter/<TEST_LETTER_SECRET>
// Generates one weekly-style issue and emails skyspeak@gmail.com (or TEST_LETTER_TO).
// Rate limit: once per minute. Hidden — 404 if secret wrong.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isTestLetterSecretValid, sendTestLetter } from '../_lib/test_letter.js'

export const config = { maxDuration: 300 }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }

  const secret = typeof req.query.secret === 'string' ? req.query.secret : ''
  if (!isTestLetterSecretValid(secret)) {
    res.status(404).json({ error: 'not found' })
    return
  }

  try {
    const result = await sendTestLetter()
    if (!result.ok) {
      if (result.retryAfterSec) {
        res.setHeader('Retry-After', String(result.retryAfterSec))
      }
      res.status(result.status).json({ error: result.error, retryAfterSec: result.retryAfterSec })
      return
    }
    res.status(200).json(result)
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : 'test letter failed',
    })
  }
}
