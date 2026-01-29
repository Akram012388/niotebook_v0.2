# ADR Status: DRAFT

## Title

CI/CD + scripts baseline for v0.2

## Context

The v0.2 spec requires bun-first scripts, predictable PR checks, and Playwright runs triggered on Vercel preview deployments. This ADR locks the minimal CI/CD and script conventions to avoid drift.

## Decision

### package.json scripts (bun-first)

Required:

- `dev`
- `dev:convex`
- `build`
- `start`
- `lint`
- `typecheck`
- `test`
- `test:e2e`

Optional:

- `format`
- `format:check`

### Vercel build command

- Use conditional deploy in Vercel Project Settings (no `vercel.json`):
  - `if [ "$VERCEL_ENV" = "production" ]; then npx convex deploy --cmd "bun run build"; else bun run build; fi`

### GitHub Actions

PR checks (required):

- Triggers: `pull_request`, `push` to `main`
- Steps: install deps, then run:
  - `bun run lint`
  - `bun run typecheck`
  - `bun test`
  - `bun run build`

Preview-data refresh:

- Trigger: nightly (02:00 UTC) + manual
- Deploy Convex to `preview-data`, run ingest, then hard-fail if transcript windows are empty.

Prod refresh (ingest):

- Trigger: manual `workflow_dispatch` only
- Deploy Convex to prod, run ingest with `NIOTEBOOK_INGEST_TOKEN`, then hard-fail if transcript windows are empty.

E2E (Playwright) on preview deploy:

- Trigger: `repository_dispatch` with type `vercel.deployment.success`
- Use deployed preview URL as `BASE_URL` and seed into `preview-data`.
- Run: `bun run test:e2e`

## Consequences

- CI is predictable and aligned with spec requirements.
- Playwright runs against real preview URLs, not localhost.
- Script names remain stable across local dev and CI.
