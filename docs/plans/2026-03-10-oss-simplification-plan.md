# OSS Simplification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove dead/private files, standardise naming, and consolidate structure so the repo is clean and navigable for external contributors.

**Architecture:** Six independent atomic commits on `refactor/oss-simplification`. Each commit is typecheck-gated. No Convex backend changes. No UI behaviour changes. The application is identical before and after.

**Tech Stack:** Bun, TypeScript strict, Next.js App Router, ESLint 9, Prettier, Lefthook pre-commit hooks

> **Design note on Task 4:** The approved design said "merge domain/ai/types.ts into chat.ts" but those types are Nio API wire types (SSE events, request shapes), not Convex-persisted chat entities. Merging them would mix unrelated concerns. The plan instead renames the directory to a flat `domain/nio.ts`, which achieves the same structural goal (kill the single-file subdirectory) with better separation.

---

### Task 1: Remove dead files and non-app assets

**Files:**

- Delete: `Dashboard-Mockup.jsx`
- Delete: `Settings-Mockup.jsx`
- Delete: `scripts/verify-phase4.sh`
- Delete: `.nvmrc`
- Delete: `niotebook-demo-videos/` (entire directory)
- Delete: `tools/` (entire directory)

**Step 1: Verify none of these are imported**

```bash
grep -r "Dashboard-Mockup\|Settings-Mockup\|verify-phase4\|niotebook-demo-videos" src/ convex/ --include="*.ts" --include="*.tsx"
```

Expected: no output (nothing imports these files).

**Step 2: Delete the files and directories**

```bash
rm Dashboard-Mockup.jsx Settings-Mockup.jsx scripts/verify-phase4.sh .nvmrc
rm -rf niotebook-demo-videos tools
```

**Step 3: Verify nothing broke**

```bash
bun run typecheck && bun run lint
```

Expected: both pass (same as baseline — warnings only from pre-existing `_omit` vars in test files).

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove dead mockups, phase script, and non-app assets"
```

---

### Task 2: Remove Gmail automation

Gmail is a self-contained private ops system. No app code outside `src/infra/email/` and `src/app/api/gmail/` imports from it.

**Files:**

- Delete: `src/infra/email/gmailClient.ts`
- Delete: `src/infra/email/gmailService.ts`
- Delete: `src/infra/email/types.ts`
- Delete: `src/app/api/gmail/callback/route.ts`
- Delete: `scripts/gmail.ts`
- Delete: `.gmail-tokens.json`
- Modify: `.gitignore` — add `.gmail-tokens.json`

**Step 1: Confirm self-containment**

```bash
grep -r "infra/email\|api/gmail" src/ --include="*.ts" --include="*.tsx" | grep -v "src/infra/email\|src/app/api/gmail"
```

Expected: no output (nothing outside those directories imports email infra).

**Step 2: Delete Gmail system files**

```bash
rm -rf src/infra/email src/app/api/gmail scripts/gmail.ts .gmail-tokens.json
```

**Step 3: Add `.gmail-tokens.json` to `.gitignore`**

Open `.gitignore` and add this line under the secrets section:

```
.gmail-tokens.json
```

**Step 4: Verify nothing broke**

```bash
bun run typecheck && bun run lint
```

Expected: both pass.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove gmail automation (private ops tooling)"
```

---

### Task 3: Standardise `scripts/` to kebab-case

All scripts renamed to kebab-case. `package.json` and CI workflow references updated. Each ingest script gets a clear header comment documenting its role in the data pipeline.

**Files:**

- Rename: `scripts/ingestCs50x2026.ts` → `scripts/ingest-cs50x-2026.ts`
- Rename: `scripts/ingestCs50Courses.ts` → `scripts/ingest-cs50-transcripts.ts`
- Rename: `scripts/e2eConvexPush.ts` → `scripts/e2e-convex-push.ts`
- Rename: `scripts/e2eEnv.ts` → `scripts/e2e-env.ts`
- Rename: `scripts/e2eSeed.ts` → `scripts/e2e-seed.ts`
- Rename: `scripts/verifyTranscriptWindows.ts` → `scripts/verify-transcript-windows.ts`
- Modify: `package.json` — update 3 script references
- Modify: `.github/workflows/e2e.yml` — update `e2eEnv.ts` reference
- Modify: `.github/workflows/_refresh-convex.yml` — update `verifyTranscriptWindows.ts` reference

**Step 1: Rename the files**

```bash
mv scripts/ingestCs50x2026.ts scripts/ingest-cs50x-2026.ts
mv scripts/ingestCs50Courses.ts scripts/ingest-cs50-transcripts.ts
mv scripts/e2eConvexPush.ts scripts/e2e-convex-push.ts
mv scripts/e2eEnv.ts scripts/e2e-env.ts
mv scripts/e2eSeed.ts scripts/e2e-seed.ts
mv scripts/verifyTranscriptWindows.ts scripts/verify-transcript-windows.ts
```

**Step 2: Update `package.json`**

Find and replace these three lines in `package.json`:

```json
"e2e:convex:push": "bun ./scripts/e2eConvexPush.ts",
"e2e:seed": "bun ./scripts/e2eSeed.ts",
"ingest:cs50x": "bun ./scripts/ingestCs50x2026.ts",
```

Replace with:

```json
"e2e:convex:push": "bun ./scripts/e2e-convex-push.ts",
"e2e:seed": "bun ./scripts/e2e-seed.ts",
"ingest:cs50x": "bun ./scripts/ingest-cs50x-2026.ts",
```

**Step 3: Update `.github/workflows/e2e.yml`**

Find the line:

```yaml
- run: bun ./scripts/e2eEnv.ts --github
```

Replace with:

```yaml
- run: bun ./scripts/e2e-env.ts --github
```

**Step 4: Update `.github/workflows/_refresh-convex.yml`**

Find the line:

```yaml
run: bun ./scripts/verifyTranscriptWindows.ts
```

Replace with:

```yaml
run: bun ./scripts/verify-transcript-windows.ts
```

**Step 5: Add ingest pipeline header comments**

Open `scripts/ingest-cs50-courses.ts` and replace or prepend the existing JSDoc header with:

```typescript
/**
 * Ingest pipeline — Step 1: Bootstrap
 *
 * Creates all 5 CS50 course + lesson records in Convex with static metadata.
 * Run this ONCE when setting up a new Convex deployment before running
 * the individual transcript ingest scripts.
 *
 * Usage: bun ./scripts/ingest-cs50-courses.ts
 *
 * Courses: CS50x 2026, CS50P, CS50AI, CS50W, CS50SQL
 */
```

Open `scripts/ingest-cs50x-2026.ts` and prepend:

```typescript
/**
 * Ingest pipeline — Step 2a: CS50x 2026
 *
 * Dynamically scrapes cs50.harvard.edu/x/ to rebuild lesson metadata and
 * transcripts for CS50x 2026. Calls ingest:ingestCs50x2026 on Convex.
 *
 * Run after Step 1 (ingest-cs50-courses.ts) to refresh CS50x content.
 *
 * Usage: CONVEX_URL=<url> bun ./scripts/ingest-cs50x-2026.ts
 */
```

Open `scripts/ingest-cs50-transcripts.ts` and prepend:

```typescript
/**
 * Ingest pipeline — Step 2b: Other CS50 courses
 *
 * Re-ingests SRT transcripts for CS50P, CS50AI, CS50SQL, and CS50W.
 * Requires those courses to already exist in Convex (run Step 1 first).
 * Calls patchLessonUrls + ingestTranscriptSegmentsBatch on Convex.
 *
 * Usage: CONVEX_URL=<url> bun ./scripts/ingest-cs50-transcripts.ts
 */
```

**Step 6: Verify nothing broke**

```bash
bun run typecheck && bun run lint
```

Expected: both pass.

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: standardise scripts/ to kebab-case, document ingest pipeline"
```

---

### Task 4: Flatten `src/domain/ai/` — rename to `src/domain/nio.ts`

`src/domain/ai/` is a single-file directory. Its types are Nio API wire types (SSE events, request shapes), not Convex-persisted chat entities. The folder is noise. The file is renamed to `src/domain/nio.ts` — flat, accurate, OSS-clear.

**Files:**

- Delete: `src/domain/ai/types.ts`
- Delete: `src/domain/ai/` (directory)
- Create: `src/domain/nio.ts`
- Modify: `src/ui/chat/useChatThread.ts` — update import path
- Modify: `src/infra/ai/nioSse.ts` — update import path
- Modify: `src/infra/ai/providerTypes.ts` — update import path
- Modify: `src/infra/ai/validateNioChatRequest.ts` — update import path
- Modify: `src/infra/ai/byokStream.ts` — update import path
- Modify: `src/app/api/nio/route.ts` — update import path

**Step 1: Verify all consumers**

```bash
grep -rn "domain/ai" src/ --include="*.ts" --include="*.tsx"
```

Expected output — exactly these 6 files (nothing else):

```
src/ui/chat/useChatThread.ts
src/infra/ai/nioSse.ts
src/infra/ai/providerTypes.ts
src/infra/ai/validateNioChatRequest.ts
src/infra/ai/byokStream.ts
src/app/api/nio/route.ts
```

**Step 2: Create `src/domain/nio.ts`**

Copy the full contents of `src/domain/ai/types.ts` into a new file `src/domain/nio.ts`. The content should be identical — do not change any type definitions.

**Step 3: Delete the old file and directory**

```bash
rm -rf src/domain/ai
```

**Step 4: Update the 6 consumer files**

For each file below, find the import from `domain/ai/types` (or `../../domain/ai/types` or `../../../domain/ai/types`) and update the path to point to `domain/nio` (with the appropriate relative prefix).

| File                                     | Old import path            | New import path       |
| ---------------------------------------- | -------------------------- | --------------------- |
| `src/ui/chat/useChatThread.ts`           | `../../domain/ai/types`    | `../../domain/nio`    |
| `src/infra/ai/nioSse.ts`                 | `../../domain/ai/types`    | `../../domain/nio`    |
| `src/infra/ai/providerTypes.ts`          | `../../domain/ai/types`    | `../../domain/nio`    |
| `src/infra/ai/validateNioChatRequest.ts` | `../../domain/ai/types`    | `../../domain/nio`    |
| `src/infra/ai/byokStream.ts`             | `../../domain/ai/types`    | `../../domain/nio`    |
| `src/app/api/nio/route.ts`               | `../../../domain/ai/types` | `../../../domain/nio` |

**Step 5: Verify**

```bash
bun run typecheck && bun run lint
```

Expected: both pass. If typecheck fails with "cannot find module", check that you updated all 6 files and the new `src/domain/nio.ts` exports all the same types as `src/domain/ai/types.ts`.

**Step 6: Confirm no old references remain**

```bash
grep -rn "domain/ai" src/ --include="*.ts" --include="*.tsx"
```

Expected: no output.

**Step 7: Commit**

```bash
git add -A
git commit -m "refactor: flatten src/domain/ai/types.ts to src/domain/nio.ts"
```

---

### Task 5: Group cache files under `src/infra/cache/`

Three flat infra files share a single purpose (IndexedDB-backed caching). Collecting them into a subdirectory signals intent clearly to contributors.

**Files:**

- Create: `src/infra/cache/` (directory)
- Move: `src/infra/localCache.ts` → `src/infra/cache/localCache.ts`
- Move: `src/infra/chatLocalCache.ts` → `src/infra/cache/chatLocalCache.ts`
- Move: `src/infra/transcriptWindowCache.ts` → `src/infra/cache/transcriptWindowCache.ts`
- Modify: `src/ui/chat/useChatThread.ts` — update `chatLocalCache` import
- Modify: `src/ui/transcript/useTranscriptWindow.ts` — update `transcriptWindowCache` import
- Modify: any other consumers (check in Step 1)

**Step 1: Find all consumers**

```bash
grep -rn "from.*localCache\|from.*chatLocalCache\|from.*transcriptWindowCache" src/ --include="*.ts" --include="*.tsx"
```

Note every file returned. You will update each one.

**Step 2: Find internal cross-imports between the cache files**

```bash
grep -n "from.*localCache\|from.*chatLocalCache\|from.*transcriptWindowCache" \
  src/infra/localCache.ts \
  src/infra/chatLocalCache.ts \
  src/infra/transcriptWindowCache.ts 2>/dev/null
```

These relative imports will also need updating after the move (they'll now be `./localCache` instead of `../localCache`).

**Step 3: Move the files**

```bash
mkdir -p src/infra/cache
mv src/infra/localCache.ts src/infra/cache/localCache.ts
mv src/infra/chatLocalCache.ts src/infra/cache/chatLocalCache.ts
mv src/infra/transcriptWindowCache.ts src/infra/cache/transcriptWindowCache.ts
```

**Step 4: Update consumer imports**

For each file identified in Step 1, update the import path. The `@/infra/` alias works — use it for imports from outside `src/infra/`:

```typescript
// Before (from src/ui/chat/useChatThread.ts)
import { readChatCache, writeChatCache } from "../../infra/chatLocalCache";

// After
import {
  readChatCache,
  writeChatCache,
} from "../../infra/cache/chatLocalCache";
```

For internal cross-imports within the cache files themselves (e.g. `chatLocalCache.ts` importing `localCache.ts`), the new relative path will be `./localCache` (same directory).

**Step 5: Verify**

```bash
bun run typecheck && bun run lint
```

Expected: both pass. If typecheck fails, check that all consumers from Step 1 have been updated.

**Step 6: Confirm no stale references**

```bash
grep -rn "infra/localCache\|infra/chatLocalCache\|infra/transcriptWindowCache" src/ --include="*.ts" --include="*.tsx" | grep -v "infra/cache/"
```

Expected: no output.

**Step 7: Commit**

```bash
git add -A
git commit -m "refactor: group infra cache files under src/infra/cache/"
```

---

### Task 6: Group dev auth bypass files under `src/infra/dev/`

`devAuth.ts` and `devAuthBypassContext.ts` are two files for one E2E-only feature. Grouping them signals clearly that these are test-only infrastructure.

**Files:**

- Create: `src/infra/dev/` (directory)
- Move: `src/infra/devAuth.ts` → `src/infra/dev/devAuth.ts`
- Move: `src/infra/devAuthBypassContext.ts` → `src/infra/dev/devAuthBypassContext.ts`
- Modify: `src/infra/convexClient.ts` — update `devAuth` import
- Modify: `src/ui/shell/TopNav.tsx` — update `devAuthBypassContext` import
- Modify: `src/app/DevAuthBypassProvider.tsx` — update `devAuthBypassContext` import

**Step 1: Confirm all consumers**

```bash
grep -rn "from.*devAuth\|from.*devAuthBypassContext" src/ --include="*.ts" --include="*.tsx"
```

Expected — exactly these 3 files:

```
src/infra/convexClient.ts       — imports devAuth
src/ui/shell/TopNav.tsx         — imports devAuthBypassContext
src/app/DevAuthBypassProvider.tsx — imports devAuthBypassContext
```

**Step 2: Move the files**

```bash
mkdir -p src/infra/dev
mv src/infra/devAuth.ts src/infra/dev/devAuth.ts
mv src/infra/devAuthBypassContext.ts src/infra/dev/devAuthBypassContext.ts
```

**Step 3: Update consumer imports**

In `src/infra/convexClient.ts`:

```typescript
// Before
import { enableDevAuthBypass } from "./devAuth";

// After
import { enableDevAuthBypass } from "./dev/devAuth";
```

In `src/ui/shell/TopNav.tsx`:

```typescript
// Before
import { useDevAuthBypass } from "@/infra/devAuthBypassContext";

// After
import { useDevAuthBypass } from "@/infra/dev/devAuthBypassContext";
```

In `src/app/DevAuthBypassProvider.tsx`:

```typescript
// Before
import { DevAuthBypassContext } from "@/infra/devAuthBypassContext";

// After
import { DevAuthBypassContext } from "@/infra/dev/devAuthBypassContext";
```

**Step 4: Verify**

```bash
bun run typecheck && bun run lint
```

Expected: both pass.

**Step 5: Confirm no stale references**

```bash
grep -rn "infra/devAuth\b\|infra/devAuthBypassContext" src/ --include="*.ts" --include="*.tsx" | grep -v "infra/dev/"
```

Expected: no output.

**Step 6: Commit**

```bash
git add -A
git commit -m "refactor: group dev auth bypass files under src/infra/dev/"
```

---

### Task 7: Final verification and push

**Step 1: Full verification suite**

```bash
bun run typecheck && bun run lint && bun run test
```

Expected: all pass.

**Step 2: Review the commit log**

```bash
git log --oneline main..HEAD
```

Expected — exactly 7 commits in order:

```
docs: add OSS simplification design doc
chore: remove dead mockups, phase script, and non-app assets
chore: remove gmail automation (private ops tooling)
chore: standardise scripts/ to kebab-case, document ingest pipeline
refactor: flatten src/domain/ai/types.ts to src/domain/nio.ts
refactor: group infra cache files under src/infra/cache/
refactor: group dev auth bypass files under src/infra/dev/
```

**Step 3: Push**

```bash
git push
```
