# OSS Simplification Design

**Date:** 2026-03-10
**Branch:** `refactor/oss-simplification`
**Status:** Approved — ready for implementation planning

## Goal

A general quality pass before making the repo fully public. Targets: external contributors who need to onboard quickly and maintainers who want to reduce ongoing cognitive overhead.

## Scope

Approach B — deletions + targeted structural consolidation. No Convex backend changes. No UI behaviour changes. Application code is not affected by any deletion.

Risk tolerance: aggressive, with careful git hygiene (one atomic commit per theme, typecheck-gated between structural moves).

---

## Section 1 — Dead file removal

One commit: `chore: remove dead mockups, phase script, and non-app assets`

| File / Dir                 | Reason                                                       |
| -------------------------- | ------------------------------------------------------------ |
| `Dashboard-Mockup.jsx`     | Design mockup at root, not imported anywhere                 |
| `Settings-Mockup.jsx`      | Design mockup at root, not imported anywhere                 |
| `scripts/verify-phase4.sh` | Old phase-verification shell script, superseded by `/verify` |
| `.nvmrc`                   | Project uses Bun; nvm has no role                            |
| `niotebook-demo-videos/`   | Demo media assets, not app code                              |
| `tools/`                   | Figma plugin + demo video directory, not app code            |

---

## Section 2 — Gmail automation removal

One commit: `chore: remove gmail automation (private ops tooling)`

Self-contained system — `src/infra/email/` is only imported by the gmail callback route. No other app code is affected.

| File / Dir           | Action                                             |
| -------------------- | -------------------------------------------------- |
| `src/infra/email/`   | Delete (gmailClient.ts, gmailService.ts, types.ts) |
| `src/app/api/gmail/` | Delete entire directory (callback/route.ts)        |
| `scripts/gmail.ts`   | Delete                                             |
| `.gmail-tokens.json` | Delete + add to `.gitignore`                       |

---

## Section 3 — Script naming standardisation

One commit: `chore: standardise scripts/ to kebab-case, document ingest pipeline`

All `scripts/` files renamed to kebab-case (OSS convention). Each ingest script receives a header comment explaining its role in the data pipeline.

| Old name                     | New name                       | Role in pipeline                                                      |
| ---------------------------- | ------------------------------ | --------------------------------------------------------------------- |
| `ingestCs50x2026.ts`         | `ingest-cs50x-2026.ts`         | Step 2a — dynamic re-ingest for CS50x 2026 (scrapes cs50.harvard.edu) |
| `ingestCs50Courses.ts`       | `ingest-cs50-transcripts.ts`   | Step 2b — transcript updater for CS50P, CS50AI, CS50SQL, CS50W        |
| `ingest-cs50-courses.ts`     | unchanged (already kebab-case) | Step 1 — bootstrap: creates all 5 course + lesson records             |
| `e2eConvexPush.ts`           | `e2e-convex-push.ts`           | E2E test utility                                                      |
| `e2eEnv.ts`                  | `e2e-env.ts`                   | E2E test utility                                                      |
| `e2eSeed.ts`                 | `e2e-seed.ts`                  | E2E test utility                                                      |
| `verifyTranscriptWindows.ts` | `verify-transcript-windows.ts` | CI verification utility                                               |
| `upload-brand-assets.ts`     | unchanged (already kebab-case) | Brand upload utility                                                  |

`package.json` `ingest:cs50x` script updated from `ingestCs50x2026.ts` → `ingest-cs50x-2026.ts`.
All internal imports within scripts updated to match.

---

## Section 4 — Structural simplification in `src/`

Three independent moves, each its own commit gated by `bun run typecheck`.

### 4a — Flatten `src/domain/ai/` single-file directory

Commit: `refactor: flatten src/domain/ai/types.ts into src/domain/chat.ts`

`src/domain/ai/` contains exactly one file (`types.ts`) with `NioChatMessage` and related types. These types belong logically in `src/domain/chat.ts`. The folder is deleted and the types are merged into `chat.ts`. All imports updated.

### 4b — Group cache files under `src/infra/cache/`

Commit: `refactor: group infra cache files under src/infra/cache/`

Three flat files with identical purpose collected into a subdirectory:

- `src/infra/localCache.ts` → `src/infra/cache/localCache.ts`
- `src/infra/chatLocalCache.ts` → `src/infra/cache/chatLocalCache.ts`
- `src/infra/transcriptWindowCache.ts` → `src/infra/cache/transcriptWindowCache.ts`

All imports updated across consumers.

### 4c — Group dev auth bypass files under `src/infra/dev/`

Commit: `refactor: group dev auth bypass files under src/infra/dev/`

Two files that form a single E2E-only feature grouped into a subdirectory:

- `src/infra/devAuth.ts` → `src/infra/dev/devAuth.ts`
- `src/infra/devAuthBypassContext.ts` → `src/infra/dev/devAuthBypassContext.ts`

All imports updated across consumers (TopNav, convexClient, DevAuthBypassEffect, DevAuthBypassProvider).

---

## Commit Sequence

```
chore: remove dead mockups, phase script, and non-app assets
chore: remove gmail automation (private ops tooling)
chore: standardise scripts/ to kebab-case, document ingest pipeline
refactor: flatten src/domain/ai/types.ts into src/domain/chat.ts
refactor: group infra cache files under src/infra/cache/
refactor: group dev auth bypass files under src/infra/dev/
```

Each commit is independently revertable. Structural commits (4a–4c) are gated by `bun run typecheck` before committing.

## Verification

After all commits: `bun run typecheck && bun run lint && bun run test`
