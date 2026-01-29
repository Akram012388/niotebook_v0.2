# Environment Requirements

This guide documents the required environment variables and where they are used.
It is intended to keep local, CI, and deployment configuration consistent.

## Core runtime variables

- `NEXT_PUBLIC_CONVEX_URL` - Required for the client Convex SDK unless Convex is disabled. Used in `src/infra/convexClient.ts`.
- `CONVEX_URL` - Optional server-side fallback for Convex HTTP client. Used in `src/app/api/nio/route.ts`.
- `GEMINI_API_KEY` - Required for real Gemini streaming. Used in `src/infra/ai/geminiStream.ts`.
- `GROQ_API_KEY` - Required for Groq fallback streaming. Used in `src/infra/ai/groqStream.ts`.

## Feature toggles

- `NIOTEBOOK_E2E_PREVIEW` - Enables stubbed AI responses and allows dev auth bypass in preview. Used in `src/app/api/nio/route.ts` and `convex/auth.ts`.
- `NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW` - Client-facing flag for preview/stub mode. Used in `src/app/api/nio/route.ts` and `src/infra/convexClient.ts`.
- `NEXT_PUBLIC_DISABLE_CONVEX` - Disables Convex usage when set to `true`. Used in `src/app/api/nio/route.ts` and `src/infra/convexClient.ts`.

## Preview maintenance

- `NIOTEBOOK_PREVIEW_DATA` - Enables preview-data cleanup cron. Set to `true` only on the preview-data deployment.

## Ingest safeguards

- `NIOTEBOOK_ALLOW_PROD_INGEST` - Required to allow ingest when `NODE_ENV=production`. Set to `true` only on preview-data and prod deployments that run ingest.
- `NIOTEBOOK_INGEST_TOKEN` - Shared ingest/ops token used by `scripts/ingestCs50x2026.ts`, `scripts/verifyTranscriptWindows.ts`, and `scripts/e2eSeed.ts`.

## Dev auth bypass

- `NIOTEBOOK_DEV_AUTH_BYPASS` - Enables dev bypass on Convex server. Used in `convex/auth.ts`.
- `NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS` - Enables dev bypass on client. Used in `src/infra/devAuth.ts` and `src/infra/convexClient.ts`.
- `NIOTEBOOK_ALLOW_DEV_BYPASS_IN_DEV` - Allows bypass in local dev outside preview. Used in `convex/auth.ts`.

Do not set `NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS=true` in production. The client
throws on production builds if the bypass is enabled without preview allowances.

## CI requirements

The CI workflow (`.github/workflows/ci.yml`) expects a Convex URL so the build
can initialize the client:

- `DEV_CONVEX_URL`

## Data refresh workflows

The repository includes automated data refresh workflows:

- `preview-data refresh` (nightly + manual) uses `CONVEX_PREVIEW_DEPLOY_KEY`, `PREVIEW_DATA_CONVEX_URL`, and `NIOTEBOOK_INGEST_TOKEN_PREVIEW_DATA`.
- `prod refresh` (manual) uses `CONVEX_PROD_DEPLOY_KEY`, `PROD_CONVEX_URL`, and `NIOTEBOOK_INGEST_TOKEN_PROD`.

Both workflows call token-gated verification via `scripts/verifyTranscriptWindows.ts`.

## E2E workflow requirements

The E2E workflow (`.github/workflows/e2e.yml`) expects:

- `PREVIEW_DATA_CONVEX_URL`
- `NIOTEBOOK_INGEST_TOKEN_PREVIEW_DATA`
- `NIOTEBOOK_E2E_VIDEO_ID`

The seed script (`scripts/e2eSeed.ts`) runs against preview-data and requires
`CONVEX_URL`, `NIOTEBOOK_INGEST_TOKEN`, and `NIOTEBOOK_E2E_VIDEO_ID`.

## Vercel preview configuration

Preview deployments should point to the long-lived preview-data Convex backend:

- `NEXT_PUBLIC_CONVEX_URL` = preview-data URL
- `NEXT_PUBLIC_DEFAULT_LESSON_ID` = lecture 10 lessonId

Do not set stub flags (`NIOTEBOOK_E2E_PREVIEW`) in Vercel preview by default.

## Vercel production configuration

Required for production:

- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_URL` (server-side Convex HTTP client)
- `GEMINI_API_KEY` and `GROQ_API_KEY` if you want real AI providers

Do not set preview-only flags in production.

## Recommended local .env.local

Use this as a baseline for local development:

```
NEXT_PUBLIC_CONVEX_URL=...your Convex URL...
CONVEX_URL=...same as above for server-side calls...
GEMINI_API_KEY=...your Gemini key...
GROQ_API_KEY=...your Groq key...
NIOTEBOOK_E2E_PREVIEW=false
NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW=false
NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS=true
NIOTEBOOK_ALLOW_DEV_BYPASS_IN_DEV=true
```

If you want to disable Convex locally:

```
NEXT_PUBLIC_DISABLE_CONVEX=true
```
