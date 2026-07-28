import OpenAI from 'openai'

// Prefer a currently free slug; free availability rotates on OpenRouter.
const DEFAULT_MODEL = 'google/gemma-4-26b-a4b-it:free'
const FREE_FALLBACKS = [
  'google/gemma-4-26b-a4b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'openai/gpt-oss-20b:free',
  'openrouter/free',
]

function client(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured')
  return new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': process.env.BASE_URL ?? 'https://theletter.vercel.app',
      'X-Title': 'dear[CC] The Letter',
    },
    timeout: 280_000,
    maxRetries: 2,
  })
}

function resolveModel(): string {
  return process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL
}

function modelCandidates(preferred?: string): string[] {
  const primary = preferred?.trim() || resolveModel()
  const rest = FREE_FALLBACKS.filter((m) => m !== primary)
  // If user pinned OPENROUTER_MODEL, try that first then free fallbacks.
  return [primary, ...rest]
}

type ChatOpts = {
  model?: string
  system?: string
  user: string
  temperature?: number
  responseFormat?: 'json_object'
  maxTokens?: number
}

function isUnavailableModelError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('404') ||
    m.includes('unavailable for free') ||
    m.includes('no endpoints found') ||
    m.includes('not found')
  )
}

export async function chat(opts: ChatOpts): Promise<string> {
  const oa = client()
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []
  if (opts.system) messages.push({ role: 'system', content: opts.system })
  messages.push({ role: 'user', content: opts.user })

  const candidates = modelCandidates(opts.model)
  const errors: string[] = []

  for (const model of candidates) {
    const body: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
      model,
      messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 4096,
      ...(opts.responseFormat === 'json_object'
        ? { response_format: { type: 'json_object' } }
        : {}),
    }

    let res: OpenAI.Chat.Completions.ChatCompletion
    try {
      res = await oa.chat.completions.create(body)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      // Many free models reject response_format — retry without it.
      if (opts.responseFormat === 'json_object') {
        try {
          const { response_format: _, ...withoutJson } = body as typeof body & {
            response_format?: unknown
          }
          void _
          res = await oa.chat.completions.create(withoutJson)
        } catch (e2) {
          const msg2 = e2 instanceof Error ? e2.message : String(e2)
          errors.push(`${model}: ${msg2}`)
          if (isUnavailableModelError(msg2) || isUnavailableModelError(msg)) continue
          throw new Error(`OpenRouter failed (${model}): ${msg2}`)
        }
      } else {
        errors.push(`${model}: ${msg}`)
        if (isUnavailableModelError(msg)) continue
        throw new Error(`OpenRouter failed (${model}): ${msg}`)
      }
    }

    const content = res.choices?.[0]?.message?.content
    if (typeof content === 'string' && content.trim()) return content

    const errObj = res as unknown as { error?: { message?: string } }
    const hint =
      errObj.error?.message ||
      (Array.isArray(res.choices) ? 'empty choices[0].message.content' : 'missing choices array')
    errors.push(`${model}: ${hint}`)
    if (isUnavailableModelError(hint)) continue
  }

  throw new Error(
    `OpenRouter returned no usable free model. Tried: ${errors.join(' | ') || candidates.join(', ')}`,
  )
}

export async function chatJson<T>(opts: Omit<ChatOpts, 'responseFormat'>): Promise<T> {
  const text = await chat({ ...opts, responseFormat: 'json_object' })
  if (!text.trim()) throw new Error('LLM returned empty string')
  return parseJsonLoose<T>(text)
}

function parseJsonLoose<T>(text: string): T {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed) as T
  } catch {
    /* continue */
  }

  const fenceStripped = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  if (fenceStripped !== trimmed) {
    try {
      return JSON.parse(fenceStripped) as T
    } catch {
      /* continue */
    }
  }

  const first = fenceStripped.indexOf('{')
  const last = fenceStripped.lastIndexOf('}')
  if (first >= 0 && last > first) {
    const sliced = fenceStripped.slice(first, last + 1)
    try {
      return JSON.parse(sliced) as T
    } catch {
      /* continue */
    }
  }

  const repaired = repairTruncatedJson(fenceStripped)
  if (repaired !== fenceStripped) {
    try {
      return JSON.parse(repaired) as T
    } catch {
      /* continue */
    }
  }

  const preview = trimmed.slice(0, 200).replace(/\s+/g, ' ')
  throw new Error(`LLM returned non-JSON. First 200 chars: ${preview}`)
}

function repairTruncatedJson(text: string): string {
  const open = text.indexOf('{')
  if (open < 0) return text
  let out = text.slice(open)
  const stack: string[] = []
  let inString = false
  let escaped = false
  for (let i = 0; i < out.length; i++) {
    const c = out[i]
    if (escaped) {
      escaped = false
      continue
    }
    if (inString) {
      if (c === '\\') escaped = true
      else if (c === '"') inString = false
      continue
    }
    if (c === '"') inString = true
    else if (c === '{' || c === '[') stack.push(c)
    else if (c === '}' || c === ']') {
      if (stack.length > 0) stack.pop()
    }
  }
  if (inString) out += '"'
  out = out.replace(/,\s*$/, '')
  while (stack.length > 0) {
    const top = stack.pop()
    out += top === '{' ? '}' : ']'
  }
  return out
}
