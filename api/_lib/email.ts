import { Resend } from 'resend'

let client: Resend | null = null

function resend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY not configured')
  if (!client) client = new Resend(key)
  return client
}

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? 'dear[CC] The Letter <onboarding@resend.dev>'
}

export async function sendLetterEmail(args: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<{ messageId: string | null }> {
  const replyTo = process.env.RESEND_REPLY_TO_EMAIL
  const { data, error } = await resend().emails.send({
    from: fromAddress(),
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
    ...(replyTo ? { replyTo } : {}),
  })
  if (error) throw new Error(error.message)
  return { messageId: data?.id ?? null }
}
