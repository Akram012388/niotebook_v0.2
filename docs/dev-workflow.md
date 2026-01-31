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
  - Local webServer runs require a preview deploy key (`CONVEX_DEPLOY_KEY` or `CONVEX_PREVIEW_DEPLOY_KEY`).
- Format: `bun run format` / `bun run format:check`

## Environments

- Dev: local Next.js + local Convex dev deployment.
- Preview: Vercel preview URL + Convex preview backend.
- Prod: Vercel production + Convex prod backend.

## CI/CD

- PR checks: lint, typecheck, unit tests, build (`.github/workflows/ci.yml`).
- Semgrep: `p/security-audit` ruleset, fails PR on findings (`.github/workflows/semgrep.yml`).
- E2E: triggered by Vercel preview deploy via `repository_dispatch` with `BASE_URL` (`.github/workflows/e2e.yml`).
  - Runs only when the deployed preview exposes the `niotebook-e2e` marker.
  - Skips non-`main` refs for repository dispatch to reduce noise.
  - Skips if the deploy payload does not include a git ref (prevents main fallback).
  - Manual runs require both `base_url` and `ref` inputs.
- Preview-data refresh: nightly + manual (`.github/workflows/preview-data-refresh.yml`) using token-gated ingest/verify.
- Prod refresh (ingest): manual (`.github/workflows/prod-refresh.yml`) using token-gated ingest/verify.
- Vercel build command: `bun run build` only (Convex deploy handled by GitHub workflows).

## Environment Variables

See `.env.example` for required variables:

- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_JWT_ISSUER_DOMAIN` (Convex deployment env)
- `NIOTEBOOK_ADMIN_EMAILS`
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`

Preview-only e2e flags:

- `NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW`
- `NIOTEBOOK_E2E_PREVIEW`
- `NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS`

## Tier 2 Code Editor Dependencies

The Tier 2 code editor adds these client-side dependencies (all MIT/ISC licensed, zero infrastructure cost):

- **CodeMirror 6:** `@codemirror/state`, `@codemirror/view`, `@codemirror/language`, `@codemirror/commands`, `@codemirror/autocomplete`, `@codemirror/search`, `@codemirror/lang-javascript`, `@codemirror/lang-python`, `@codemirror/lang-html`, `@codemirror/lang-cpp`, `@codemirror/theme-one-dark`, `@lezer/highlight`
- **Terminal:** `@xterm/xterm`, `@xterm/addon-fit`, `@xterm/addon-web-links`
- **State management:** `zustand` (v5)
- **Persistence:** `idb` (IndexedDB wrapper)

All browser-only components (CM6, xterm.js) are loaded via `next/dynamic({ ssr: false })`.

## Convex Status

- Deployments are isolated per environment (dev/preview-data/prod).
- Data ingest is automated per deployment; avoid manual dashboard edits.
