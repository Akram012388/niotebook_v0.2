## Phase 0 Status (Complete)

**What’s done**

- Phase 2 complete: lesson routing, transcript context, resume snapshots
- Phase 3 complete: YouTube embed + authoritative video time flow
- Transcript ingestion pipeline (CS50x 2026) and control center redesign
- Convex schema and core APIs (courses, lessons, transcripts, chat, resume)
- Security foundations (auth boundaries, rate limits, error taxonomy)
- CI baseline (lint, typecheck, unit tests, E2E wiring)

**What’s next**

- AI route integration (Gemini primary, Groq fallback)
- Error-state banner pass (video/chat) after phase stabilization

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
- Preview-data refresh: nightly + manual (`.github/workflows/preview-data-refresh.yml`) using token-gated ingest/verify.
- Prod refresh (ingest): manual (`.github/workflows/prod-refresh.yml`) using token-gated ingest/verify.
- Vercel build command: `bun run build` only (Convex deploy handled by GitHub workflows).

## Environment Variables

See `.env.example` for required variables:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_URL`
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`

## Convex Status

- Deployments are isolated per environment (dev/preview-data/prod).
- Data ingest is automated per deployment; avoid manual dashboard edits.
