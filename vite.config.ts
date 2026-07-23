import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

/** Load .env.local / .env keys into process.env for local API middleware. */
function loadLocalEnv() {
  for (const name of ['.env.local', '.env'] as const) {
    const path = resolve(process.cwd(), name)
    if (!existsSync(path)) continue
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq < 0) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = val
    }
  }
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as Record<
      string,
      unknown
    >
  } catch {
    throw new Error('invalid json')
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function localApiPlugin(): Plugin {
  return {
    name: 'field-report-local-api',
    configureServer(server) {
      loadLocalEnv()
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const path = url.pathname

        try {
          if (req.method === 'POST' && path === '/api/subscribe') {
            const body = await readJsonBody(req)
            const { enrollSubscriber } = await import('./api/_lib/enroll.js')
            const result = await enrollSubscriber({
              email: typeof body.email === 'string' ? body.email : '',
              industry: typeof body.industry === 'string' ? body.industry : null,
              role: typeof body.role === 'string' ? body.role : null,
              name: typeof body.name === 'string' ? body.name : null,
              focusAreas: Array.isArray(body.focusAreas)
                ? (body.focusAreas as string[])
                : null,
              sourceRef: typeof body.sourceRef === 'string' ? body.sourceRef : null,
              linkedinUrl:
                typeof body.linkedinUrl === 'string' ? body.linkedinUrl : null,
              targetJob: typeof body.targetJob === 'string' ? body.targetJob : null,
            })
            if (!result.ok) {
              sendJson(res, result.status, { error: result.error })
              return
            }
            if ('skipped' in result) {
              sendJson(res, 200, { ok: true, skipped: result.skipped })
            } else {
              sendJson(res, 200, { ok: true, welcomeSent: result.welcomeSent })
            }
            return
          }

          if (req.method === 'GET' && path === '/api/plan/profile') {
            const { getPlanProfile } = await import('./api/_lib/plan.js')
            const result = await getPlanProfile(url.searchParams.get('t') ?? '')
            if (!result.ok) {
              sendJson(res, result.status, { error: result.error })
              return
            }
            sendJson(res, 200, result)
            return
          }

          if (req.method === 'POST' && path === '/api/plan/analyze') {
            const body = await readJsonBody(req)
            const { analyzeGamePlan } = await import('./api/_lib/plan.js')
            const result = await analyzeGamePlan({
              email: typeof body.email === 'string' ? body.email : '',
              jobInput: typeof body.jobInput === 'string' ? body.jobInput : '',
              linkedinUrl:
                typeof body.linkedinUrl === 'string' ? body.linkedinUrl : null,
              focusNote: typeof body.focusNote === 'string' ? body.focusNote : null,
              fromLetter: Boolean(body.fromLetter),
              token: typeof body.token === 'string' ? body.token : null,
              name: typeof body.name === 'string' ? body.name : null,
              role: typeof body.role === 'string' ? body.role : null,
              industry: typeof body.industry === 'string' ? body.industry : null,
              focusAreas: Array.isArray(body.focusAreas)
                ? (body.focusAreas as string[])
                : null,
              sourceRef: typeof body.sourceRef === 'string' ? body.sourceRef : null,
            })
            if (!result.ok) {
              sendJson(res, result.status, { error: result.error })
              return
            }
            sendJson(res, 200, { ok: true, plan: result.plan })
            return
          }

          if (req.method === 'POST' && path === '/api/plan/waitlist') {
            const body = await readJsonBody(req)
            const { joinCohortWaitlist } = await import('./api/_lib/plan.js')
            const result = await joinCohortWaitlist(
              typeof body.email === 'string' ? body.email : '',
            )
            if (!result.ok) {
              sendJson(res, result.status, { error: result.error })
              return
            }
            sendJson(res, 200, { ok: true, email: result.email })
            return
          }

          if (req.method === 'GET' && path === '/api/plan/get') {
            const { getGamePlanById } = await import('./api/_lib/plan.js')
            const result = await getGamePlanById(url.searchParams.get('id') ?? '')
            if (!result.ok) {
              sendJson(res, result.status, { error: result.error })
              return
            }
            sendJson(res, 200, { ok: true, plan: result.plan })
            return
          }
        } catch (e) {
          sendJson(res, e instanceof Error && e.message === 'invalid json' ? 400 : 500, {
            error: e instanceof Error ? e.message : 'request failed',
          })
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  server: { port: 5174 },
  plugins: [react(), tailwindcss(), localApiPlugin()],
})
