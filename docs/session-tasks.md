# Session Tasks — Ops Refactor (Plan-Driven)

## Status

- Current phase: Phase 4 (OPS-4)
- Last updated: 2026-01-29

## Plan (North Star)

- [x] OPS-1 (phase 1, logging) — Update ingest error logging in `scripts/ingestCs50x2026.ts`. Files: `scripts/ingestCs50x2026.ts`, `docs/session-tasks.md`. Completed: 4645e61.
- [x] OPS-2 (phase 2, verify) — Add token-gated transcript verification query in `convex/ops.ts` and rewrite verifier script to call it via `ConvexHttpClient`. Files: `convex/ops.ts`, `scripts/verifyTranscriptWindows.ts`, `docs/session-tasks.md`. Completed: f593a46.
- [x] OPS-3 (phase 3, preview refresh) — Pin preview-data refresh workflow to deployment-scoped key and token-based ingest/verify. Files: `.github/workflows/preview-data-refresh.yml`, `docs/session-tasks.md`. Completed: 58374ef.
- [~] OPS-4 (phase 4, prod refresh) — Use token-based verifier in prod refresh workflow. Files: `.github/workflows/prod-refresh.yml`, `docs/session-tasks.md`. Status: in_progress.
- [ ] OPS-5 (phase 5, e2e seed) — Add token-gated E2E seed mutation and update seed script/workflow to use it. Files: `convex/ops.ts`, `scripts/e2eSeed.ts`, `.github/workflows/e2e.yml`, `docs/session-tasks.md`.

## Execution Rules

- Before starting a task: mark it as `[~] in_progress` in this file.
- After committing a task: mark it as `[x] completed` and append the commit SHA.
- Never mark tasks completed without a commit.
