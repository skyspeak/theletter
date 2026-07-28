import OpenAI from 'openai'

const DEFAULT_MODEL = 'openrouter/free'

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

type ChatOpts = {
  model?: string
  system?: string
  user: string
  temperature?: number
  responseFormat?: 'json_object'
  maxTokens?: number
}

export async function chat(opts: ChatOpts): Promise<string> {
  const oa = client()
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []
  if (opts.system) messages.push({ role: 'system', content: opts.system })
  messages.push({ role: 'user', content: opts.user })

  const res = await oa.chat.completions.create({
    model: opts.model ?? process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL,
    messages,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 4096,
    ...(opts.responseFormat === 'json_object'
      ? { response_format: { type: 'json_object' } }
      : {}),
  })

  return res.choices[0]?.message?.content ?? ''
}

export async function chatJson<T>(opts: Omit<ChatOpts, 'responseFormat'>): Promise<T> {
  const text = await chat({ ...opts, responseFormat: 'json_object' })
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
