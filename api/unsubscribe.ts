// GET|POST /api/unsubscribe?t=<token> — soft-unsubscribe from The Letter

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from './_lib/db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }

  const token =
    typeof req.query.t === 'string'
      ? req.query.t
      : typeof req.body?.t === 'string'
        ? req.body.t
        : null

  if (!token) {
    res.status(400).send(htmlPage('Missing unsubscribe token.', false))
    return
  }

  try {
    const sub = await prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
    })
    if (!sub) {
      res.status(404).send(htmlPage('This unsubscribe link is invalid.', false))
      return
    }

    if (!sub.unsubscribedAt) {
      await prisma.newsletterSubscriber.update({
        where: { id: sub.id },
        data: { unsubscribedAt: new Date() },
      })
    }

    res.status(200).send(htmlPage('You are unsubscribed from dear[CC] The Letter.', true))
  } catch {
    res.status(500).send(htmlPage('Something went wrong. Try again later.', false))
  }
}

function htmlPage(message: string, ok: boolean): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>dear[CC] The Letter</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    font-family:'DM Sans',system-ui,sans-serif;color:#141414;background:#fff;
    background-image:radial-gradient(ellipse 90% 55% at 50% -25%,rgba(212,85,47,.1),transparent)}
  main{max-width:28rem;padding:2rem;text-align:center}
  h1{font-family:Fraunces,Georgia,serif;font-weight:500;font-size:1.75rem;margin:0 0 .75rem}
  .cc{color:#d4552f} p{color:#71717a;line-height:1.5}
  a{color:#d4552f}
</style></head>
<body><main>
  <h1>dear<span class="cc">[</span><span class="cc">CC</span><span class="cc">]</span> The Letter</h1>
  <p>${message}</p>
  ${ok ? '<p><a href="/">Back to Field Report</a></p>' : ''}
</main></body></html>`
}
