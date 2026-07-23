# dear[CC] The Letter

Weekly AI + career email with StayRelevant-style curation (real article pools + OpenRouter). Optional Game Plan. Enroll from this site or Field Report via CORS.

## Develop

```bash
npm install
cp .env.example .env.local
# Fill DATABASE_URL, RESEND_*, CRON_SECRET, BASE_URL, FIELD_REPORT_URL, CORS_ORIGINS
# For curated weekly issues: OPENROUTER_API_KEY + TAVILY_API_KEY (HN/RSS work without Tavily)
npx prisma db push
npm run dev   # http://localhost:5174
```

## Weekly generation

Pipeline mirrors StayRelevant: HN + Reddit + AI-newsletter RSS (+ Tavily for X/domain/build) → full curator system/user prompts in `api/_lib/prompts.ts` → OpenRouter JSON → sanitize → email in Letter aesthetic (Fraunces / terracotta).

Without `OPENROUTER_API_KEY`, the Sunday cron falls back to rotating templates.

## Deploy (Vercel)

Import [skyspeak/theletter](https://github.com/skyspeak/theletter). Set env from `.env.example`. Cron: `0 14 * * 0` → `/api/cron/newsletter`.

Field Report should set `VITE_LETTER_URL` to this deployment so Results/Map can enroll readers.

## Stack

Vite · React · Prisma · Neon · Resend · OpenRouter · Tavily · Vercel Cron
