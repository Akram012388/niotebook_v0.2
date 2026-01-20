## Phase 0 Status (Complete)

**What’s done**

- Phase 2 complete: lesson routing, transcript context, resume snapshots
- Convex schema and core APIs (courses, lessons, transcripts, chat, resume)
- Security foundations (invite TTL, rate limits, error taxonomy)
- CI baseline (lint, typecheck, unit tests, E2E wiring)

**What’s next**

- Phase 3: YouTube embed + authoritative video time flow
- Transcript ingestion job (CS50x 2026)
- AI route integration (Gemini primary, Groq fallback)

## UI/UX Contract

The binding UI/UX contract lives in `docs/ui-ux-contract.md`. Builders must
follow it for layout, navigation, and interaction behavior.

# Dev/Test/Prod Workflow (KISS)

## Local Setup

- Requirements: Node 20 LTS, Bun 1.1.x.
- If Bun was just installed, reload shell: `exec /bin/zsh`.
- Install deps: `bun install`.

## Local Development

- App dev server: `bun run dev` (Turbopack).
- Convex dev server: `bun run dev:convex` (placeholder until project is bound).

## Scripts

- Lint: `bun run lint`
- Typecheck: `bun run typecheck`
- Unit tests: `bun run test`
- E2E (CI-style): `bun run test:e2e`
- E2E (local): `bun run test:e2e:local` (installs Playwright browsers, uses `webServer`)
- Format: `bun run format` / `bun run format:check`

## Environments

- Dev: local Next.js + local Convex dev deployment.
- Preview: Vercel preview URL + Convex preview backend.
- Prod: Vercel production + Convex prod backend.

## CI/CD

- PR checks: lint, typecheck, unit tests, build (`.github/workflows/ci.yml`).
- Semgrep: `p/security-audit` ruleset, fails PR on findings (`.github/workflows/semgrep.yml`).
- E2E: triggered by Vercel preview deploy via `repository_dispatch` with `BASE_URL` (`.github/workflows/e2e.yml`).
- Vercel build command: `npx convex deploy --cmd 'bun run build'` (`vercel.json`).

## Environment Variables

See `.env.example` for required variables:

- `NEXT_PUBLIC_APP_URL`
- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CONVEX_URL`
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`

## Convex Status

- `convex.json` is a placeholder until Phase 0/first preview deploy.
- Bind to a real Convex project when ready and update `CONVEX_DEPLOYMENT`.
