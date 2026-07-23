# dear[CC] The Letter

Weekly AI + career email. Optional Game Plan (gap analysis + roadmap). Enroll from this site or from Field Report via CORS.

## Develop

```bash
npm install
cp .env.example .env.local
# Fill DATABASE_URL, RESEND_*, CRON_SECRET, BASE_URL, FIELD_REPORT_URL, CORS_ORIGINS
npx prisma db push
npm run dev   # http://localhost:5174
```

## Deploy (Vercel)

Import [skyspeak/theletter](https://github.com/skyspeak/theletter). Set env from `.env.example`. Cron: `0 14 * * 0` → `/api/cron/newsletter`.

Field Report should set `VITE_LETTER_URL` to this deployment so Results/Map can enroll readers.

## Stack

Vite · React · Prisma · Neon · Resend · Vercel Cron
