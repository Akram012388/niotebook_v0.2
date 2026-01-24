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

## Dev auth bypass

- `NIOTEBOOK_DEV_AUTH_BYPASS` - Enables dev bypass on Convex server. Used in `convex/auth.ts`.
- `NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS` - Enables dev bypass on client. Used in `src/infra/devAuth.ts` and `src/infra/convexClient.ts`.
- `NIOTEBOOK_ALLOW_DEV_BYPASS_IN_DEV` - Allows bypass in local dev outside preview. Used in `convex/auth.ts`.

Do not set `NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS=true` in production. The client
throws on production builds if the bypass is enabled without preview allowances.

## CI requirements

The CI workflow (`.github/workflows/ci.yml`) requires the following secrets:

- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`

These must be set in GitHub Secrets for the repository.

## E2E workflow requirements

The E2E workflow (`.github/workflows/e2e.yml`) expects:

- `CONVEX_PREVIEW_DEPLOY_KEY` (mapped to `CONVEX_DEPLOY_KEY` for preview deploys)
- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CONVEX_URL`
- `NIOTEBOOK_E2E_VIDEO_ID`
- `VERCEL_AUTOMATION_BYPASS_SECRET`
- `VERCEL_API_TOKEN`
- `VERCEL_PROJECT_ID`
- `VERCEL_E2E_ALIAS` (optional)

The E2E seed script (`scripts/e2eSeed.ts`) requires `CONVEX_DEPLOY_KEY` and sets
preview-specific flags inside the Convex deployment.

## Vercel preview configuration

The E2E workflow upserts these preview env vars in Vercel:

- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`
- `NIOTEBOOK_E2E_PREVIEW=true`
- `NIOTEBOOK_DEV_AUTH_BYPASS=true`

These are intended for preview only.

## Vercel production configuration

Required for production:

- `NEXT_PUBLIC_CONVEX_URL` (and optionally `CONVEX_URL` if server side needs it)
- `GEMINI_API_KEY` and `GROQ_API_KEY` if you want real AI providers

Do not set preview-only flags in production.

## Recommended local .env.local

Use this as a baseline for local development:

```
NEXT_PUBLIC_CONVEX_URL=...your Convex URL...
CONVEX_DEPLOYMENT=...optional if needed...
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
