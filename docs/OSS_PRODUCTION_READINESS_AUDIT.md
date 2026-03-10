# Niotebook v0.2 — Production-Readiness Audit for OSS Release

> **Date:** 2026-03-10
> **Branch:** `main` (commit `b8c81d0`)
> **Method:** 5 independent review agents across all codebase layers, read-only analysis
> **Purpose:** Determine if the codebase is production-grade for full open-source release

---

## Executive Summary

The codebase is well-architected, consistently typed, and follows strong conventions.
It is **not yet production-ready for full OSS release** due to security findings and
correctness bugs that must be addressed first. This document catalogues every finding
with a concrete implementation plan for each fix.

### Scorecard

| Layer                         | Verdict          | Critical | High   | Medium | Low   |
| ----------------------------- | ---------------- | -------- | ------ | ------ | ----- |
| Convex Backend                | NEEDS ATTENTION  | 4        | 4      | 5      | 3     |
| Infrastructure (`src/infra/`) | NEEDS ATTENTION  | 3        | 4      | 3      | 0     |
| Domain (`src/domain/`)        | PRODUCTION-READY | 0        | 2      | 0      | 0     |
| Frontend (`src/ui/`)          | NEEDS ATTENTION  | 2        | 6      | 5      | 4     |
| API & Auth (`src/app/`)       | NEEDS ATTENTION  | 2        | 5      | 2      | 0     |
| **TOTAL**                     |                  | **11**   | **21** | **15** | **7** |

---

## Implementation Waves

Fixes are grouped into three waves by priority. Each wave should be a separate PR.

---

## Wave 1 — Security Blockers (Must Fix Before OSS Release)

### W1-01: Separate E2E Preview Auth Bypass Flags

**Severity:** CRITICAL
**Files:**

- `src/ui/admin/AdminGuard.tsx:13-14`
- `src/ui/auth/AuthGate.tsx:79-83`
- `src/app/api/nio/route.ts:43-68`
- `next.config.ts` (build-time guard)

**Problem:**
`NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW=true` disables auth in AuthGate, AdminGuard,
AND the API route handler — all via a single client-bundle-inlined variable.
Any Vercel Preview deployment with this flag is a completely open system.

**Implementation:**

1. **AdminGuard** — Remove the `isE2ePreview` short-circuit entirely. E2E tests
   that need admin access must log in as an admin test user through the normal
   Clerk flow. The admin role check must NEVER be bypassed by an environment
   variable.

   ```ts
   // REMOVE this line:
   // const isE2ePreview = process.env.NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW === "true";
   // REMOVE the early return on isE2ePreview
   ```

2. **AuthGate** — Keep `NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW` only for the
   `<meta name="niotebook-e2e">` readiness marker in `layout.tsx`. Remove its
   use from auth bypass logic in AuthGate. The E2E preview should use the
   server-only `NIOTEBOOK_E2E_PREVIEW` variable for auth relaxation.

3. **API route** — In `isConvexAuthRequired()`:
   - Remove the `NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW` check entirely.
   - Keep only the server-only `NIOTEBOOK_E2E_PREVIEW` check.
   - Narrow the `NODE_ENV` check: instead of `NODE_ENV !== "production"`,
     require an explicit `NIOTEBOOK_SKIP_API_AUTH=true` flag.

4. **Build-time guard** — Add to `next.config.ts`:
   ```ts
   if (
     process.env.NODE_ENV === "production" &&
     process.env.NIOTEBOOK_E2E_PREVIEW === "true"
   ) {
     throw new Error(
       "NIOTEBOOK_E2E_PREVIEW must not be true in production builds.",
     );
   }
   ```

**Test plan:**

- Verify Clerk auth is enforced on `/admin/**` even with `NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW=true`
- Verify `/api/nio` returns 401 without a valid Clerk JWT in production mode
- Verify build throws when `NIOTEBOOK_E2E_PREVIEW=true` + `NODE_ENV=production`

---

### W1-02: Fix Prompt Injection Detection Regex Bug

**Severity:** CRITICAL
**File:** `src/infra/ai/promptInjection.ts:6-17`

**Problem:**
Static regex patterns use the `g` flag, which persists `lastIndex` between
`test()` calls. This makes detection unreliable on alternating invocations —
every other call to the same pattern may return a false negative.

**Implementation:**
Remove the `g` flag from all static detection patterns:

```ts
// BEFORE:
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts)/gi,
  // ...
];

// AFTER:
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts)/i,
  // ...
];
```

**Test plan:**

- Add a unit test that calls the detection function twice in a row with the
  same injecting input and asserts both calls return `true`
- Run existing prompt injection tests: `bunx vitest run src/infra/ai/promptInjection`

---

### W1-03: Sanitize R Plot SVG Output / Add iframe Sandbox

**Severity:** CRITICAL
**File:** `src/ui/panes/RPlotFrame.tsx:23`

**Problem:**
Raw R runtime stdout (SVG data) is interpolated directly into iframe `srcdoc`
with no sanitization. Malicious R scripts can inject `<script>` tags that
execute in the parent origin's context.

**Implementation:**

1. Add `sandbox` attribute to the iframe element to prevent script execution:
   ```ts
   frame.sandbox.add("allow-same-origin");
   // Do NOT add "allow-scripts"
   ```
2. Strip `<script>` tags and `on*` event attributes from `svgData` before
   injection as defense-in-depth:
   ```ts
   const sanitizeSvg = (svg: string): string =>
     svg
       .replace(/<script[\s\S]*?<\/script>/gi, "")
       .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
       .replace(/\son\w+\s*=\s*'[^']*'/gi, "");
   ```

**Test plan:**

- Verify R plot rendering still works with the sandbox attribute
- Verify `<script>alert(1)</script>` embedded in SVG output does not execute

---

### W1-04: Auth-Gate `cleanupPreviewData` Mutation

**Severity:** CRITICAL
**File:** `convex/maintenance.ts:11`

**Problem:**
Public Convex mutation with no auth guard. Any unauthenticated caller can
trigger bulk deletion of preview data.

**Implementation:**
Add authentication check at the top of the mutation:

```ts
export const cleanupPreviewData = mutation({
  handler: async (ctx) => {
    // Add auth guard
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required.");
    // Optionally: also check admin role via requireMutationAdmin(ctx)

    // ... existing cleanup logic
  },
});
```

**Test plan:**

- Verify unauthenticated calls to `cleanupPreviewData` throw
- Verify authenticated admin calls still succeed
- Run: `bunx vitest run tests/convex/maintenance`

---

### W1-05: Rate-Limit `completeAssistantMessage`

**Severity:** CRITICAL
**File:** `convex/chat.ts:224-320`

**Problem:**
`completeAssistantMessage` doesn't check the rate limiter. Clients can call it
directly to bypass AI usage rate limits.

**Implementation:**
Add rate limiter check at the start of the mutation, consistent with other
rate-limited mutations in the file:

```ts
export const completeAssistantMessage = mutation({
  handler: async (ctx, args) => {
    const user = await requireMutationUser(ctx);
    // Add rate limit check
    await enforceRateLimit(ctx, user._id);
    // ... existing logic
  },
});
```

**Test plan:**

- Verify rate limit is enforced when calling `completeAssistantMessage` directly
- Run: `bunx vitest run tests/convex/chat`

---

### W1-06: Fix `ensureChatThread` Race Condition

**Severity:** CRITICAL
**File:** `convex/chat.ts:101-128`

**Problem:**
Non-atomic check-then-insert pattern. Concurrent requests can create duplicate
chat threads for the same user+lesson pair.

**Implementation:**
Use Convex's unique index constraint to prevent duplicates. If a unique index
on `(userId, lessonId)` already exists on `chatThreads`, catch the duplicate
key error and return the existing thread:

```ts
// Option A: Add unique index in schema.ts
chatThreads: defineTable({
  userId: v.id("users"),
  lessonId: v.id("lessons"),
  // ...
}).index("by_user_lesson", ["userId", "lessonId"]),
// Then in ensureChatThread: query by index first, insert with try-catch

// Option B: If Convex doesn't support unique indexes, use a transactional
// pattern: always query first within the same mutation (which is atomic
// in Convex), and only insert if not found.
```

**Test plan:**

- Verify concurrent calls to `ensureChatThread` with the same user+lesson
  result in exactly one thread
- Run: `bunx vitest run tests/convex/chat`

---

### W1-07: Add CORS Policy to `/api/nio`

**Severity:** HIGH
**File:** `src/infra/ai/nioSse.ts:4-9`

**Problem:**
No CORS headers on the SSE endpoint. Cross-origin pages can open EventSource
connections. Clerk's `SameSite=None` cookies are sent automatically.

**Implementation:**

1. Add `Access-Control-Allow-Origin` to `NIO_SSE_HEADERS`:

   ```ts
   export const NIO_SSE_HEADERS: Record<string, string> = {
     "Content-Type": "text/event-stream",
     "Cache-Control": "no-cache, no-transform",
     Connection: "keep-alive",
     "X-Accel-Buffering": "no",
     "Access-Control-Allow-Origin":
       process.env.NEXT_PUBLIC_APP_URL ?? "https://niotebook.com",
     "Access-Control-Allow-Credentials": "true",
   };
   ```

2. Add an `OPTIONS` handler in `src/app/api/nio/route.ts`:
   ```ts
   export function OPTIONS(): Response {
     return new Response(null, {
       status: 204,
       headers: {
         "Access-Control-Allow-Origin":
           process.env.NEXT_PUBLIC_APP_URL ?? "https://niotebook.com",
         "Access-Control-Allow-Methods": "POST, OPTIONS",
         "Access-Control-Allow-Headers": "Content-Type, Authorization",
         "Access-Control-Max-Age": "86400",
       },
     });
   }
   ```

**Test plan:**

- Verify same-origin requests work as before
- Verify cross-origin requests from unauthorized origins are blocked
- Add `NEXT_PUBLIC_APP_URL` to `.env.example` with documentation

---

### W1-08: Add Content-Security-Policy Header

**Severity:** HIGH
**File:** `next.config.ts:36-73`

**Problem:**
No CSP header anywhere in the application. Zero browser-level XSS containment.

**Implementation:**
Add a CSP header to the global headers in `next.config.ts`:

```ts
{
  key: "Content-Security-Policy",
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.clerk.accounts.dev",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.clerk.com https://img.clerk.com https://i.ytimg.com",
    "connect-src 'self' https://*.convex.cloud https://*.clerk.accounts.dev https://generativelanguage.googleapis.com https://api.groq.com https://api.openai.com https://api.anthropic.com",
    "frame-src https://www.youtube.com https://www.youtube-nocookie.com 'self'",
    "worker-src 'self' blob:",
    "media-src 'self' blob:",
  ].join("; "),
}
```

> Note: `'unsafe-inline'` and `'unsafe-eval'` are needed for Next.js + Pyodide
> WASM. A nonce-based approach is preferred long-term but requires Next.js
> middleware integration. This baseline CSP still prevents data exfiltration via
> `connect-src` restriction.

**Test plan:**

- Verify the app loads correctly with the CSP header
- Verify YouTube embeds, Clerk auth, Convex connections all work
- Check browser console for CSP violations during normal usage

---

## Wave 2 — Correctness Fixes

### W2-01: Fix VFS `restore()` Stale `mainFilePath`

**Severity:** CRITICAL
**File:** `src/infra/vfs/VirtualFS.ts:241-250`

**Problem:**
After lesson switching, `mainFilePath` retains the previous lesson's value.

**Implementation:**
Reset `mainFilePath` at the start of `restore()`:

```ts
restore(snapshot: VfsSnapshot): void {
  this.mainFilePath = snapshot.mainFilePath ?? "";
  // ... existing restore logic
}
```

**Test plan:**

- Run: `bunx vitest run src/infra/vfs/`
- Verify lesson switching resets the active file path

---

### W2-02: Move Terminal Store Module-Level State into Zustand

**Severity:** CRITICAL
**File:** `src/ui/code/terminal/useTerminalStore.ts:38-50`

**Problem:**
`lastOutputEndedWithNewline` and `hasOutputSincePrompt` are module-level `let`
variables shared across all component instances — unsafe in React 19 concurrent mode.

**Implementation:**
Move both flags into the Zustand store state:

```ts
interface TerminalState {
  // ... existing fields
  lastOutputEndedWithNewline: boolean;
  hasOutputSincePrompt: boolean;
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  // ... existing state
  lastOutputEndedWithNewline: true,
  hasOutputSincePrompt: false,
  // Update writePrompt, clear, etc. to use get()/set() instead of bare variables
}));
```

**Test plan:**

- Verify terminal prompt rendering works correctly after the refactor
- Verify HMR does not cause double-prompts

---

### W2-03: Fix AdminGuard TOCTOU Flash

**Severity:** HIGH
**File:** `src/ui/admin/AdminGuard.tsx:17-23`

**Problem:**
Admin content renders for one frame before redirect fires for non-admin users.
Between the render where `denied` becomes true and the `useEffect` calling
`router.replace("/")`, children are visible.

**Implementation:**
Move the `denied` check before the `return <>{children}</>` line:

```ts
// After the loading/spinner checks, before rendering children:
if (denied) {
  return (
    <div className="flex h-screen items-center justify-center">
      <p>Access denied. Redirecting...</p>
    </div>
  );
}

return <>{children}</>;
```

**Test plan:**

- Verify non-admin users never see admin content flash
- Verify admin users see the admin dashboard normally

---

### W2-04: Fix SQL Executor Module-Level Seed State

**Severity:** HIGH
**File:** `src/infra/runtime/sqlExecutor.ts:29-33`

**Problem:**
Seed failure leaves `seeded = true`, preventing retry on subsequent executions.

**Implementation:**
Only set `seeded = true` after successful seeding:

```ts
let seeded = false;

async function ensureSeeded(db: Database): Promise<void> {
  if (seeded) return;
  try {
    await seedDatabase(db);
    seeded = true; // Only on success
  } catch (error) {
    // seeded remains false — allows retry
    throw error;
  }
}
```

**Test plan:**

- Verify SQL executor recovers after a failed seed attempt
- Run: `bunx vitest run src/infra/runtime/sqlExecutor`

---

### W2-05: Fix Python Executor Timeout — Cancel Pyodide Execution

**Severity:** HIGH
**File:** `src/infra/runtime/pythonExecutor.ts:188-208`

**Problem:**
Timeout doesn't cancel Pyodide execution. Infinite loops hang the tab forever.

**Implementation:**
Use Pyodide's `interruptBuffer` to signal cancellation:

```ts
// Set up SharedArrayBuffer for interrupt signaling
const interruptBuffer = new Int32Array(new SharedArrayBuffer(4));
pyodide.setInterruptBuffer(interruptBuffer);

// In timeout handler:
setTimeout(() => {
  Atomics.store(interruptBuffer, 0, 2); // Signal KeyboardInterrupt
}, TIMEOUT_MS);
```

> Note: `SharedArrayBuffer` requires COOP/COEP headers, which are already set
> on `/editor-sandbox`. If Python runs outside the sandbox, a Web Worker
> approach with `worker.terminate()` is the fallback.

**Test plan:**

- Verify `while True: pass` is terminated after timeout
- Verify normal Python programs complete successfully

---

### W2-06: Fix R Executor `stop()` — Implement Actual Cancellation

**Severity:** HIGH
**File:** `src/infra/runtime/rExecutor.ts:280-282`

**Problem:**
`stop()` is a no-op. Long-running R scripts have a 30-second timeout risk
with no cancellation mechanism.

**Implementation:**
Terminate the Web Worker or webR instance:

```ts
async stop(): Promise<void> {
  if (this.webR) {
    await this.webR.close();
    this.webR = null;
    this.initialized = false;
  }
}
```

**Test plan:**

- Verify R executor can be stopped mid-execution
- Verify subsequent R executions work after a stop

---

### W2-07: Clear SSE Timer on Client Abort

**Severity:** HIGH
**File:** `src/app/api/nio/route.ts:482-534`

**Problem:**
`streamTimeoutHandle` is not cleared on client abort, keeping the serverless
function alive for up to 2 minutes after disconnect — direct billing impact.

**Implementation:**

```ts
const abort = (): void => {
  clearTimeout(streamTimeoutHandle); // Add this line
  aborted = true;
  close();
};
```

**Test plan:**

- Verify client disconnect immediately frees the serverless function
- Verify normal stream completion still works

---

### W2-08: Fix SSE Stream Incomplete Final Line

**Severity:** HIGH
**File:** `src/infra/ai/sseStream.ts:20-65`

**Problem:**
Incomplete final line (no trailing newline) is silently discarded after stream end.

**Implementation:**
After the stream ends, flush any remaining buffer content:

```ts
// After the read loop completes:
if (buffer.length > 0) {
  // Process the remaining buffer as a final line
  yield buffer;
}
```

**Test plan:**

- Verify SSE streams that end without a trailing newline still yield the final event
- Run: `bunx vitest run src/infra/ai/sseStream`

---

### W2-09: Fix `StreamingText` Continuous RAF Loop

**Severity:** HIGH
**File:** `src/ui/chat/StreamingText.tsx:70-82`

**Problem:**
RAF loop runs indefinitely at 60fps even when there is nothing to reveal.
With 20+ messages in a chat thread, this causes 20+ simultaneous no-op RAF
callbacks.

**Implementation:**
Stop the loop when idle; restart when `append()` is called:

```ts
// In tick():
if (pending.length === 0) {
  if (dirtyRef.current) {
    /* flush */
  }
  // Do NOT reschedule — stop the loop
  return;
}

// In append():
const wasIdle = pending.length === 0;
pending.push(...chars);
if (wasIdle) {
  rafRef.current = requestAnimationFrame(tick);
}
```

**Test plan:**

- Verify streaming text still animates correctly
- Verify CPU usage drops when streaming is idle (check via Performance tab)

---

### W2-10: Add Rate Limiting to Feedback Submission

**Severity:** HIGH
**File:** `convex/feedback.ts:6-27`

**Problem:**
No rate limiting on feedback submission. Attackers can spam the endpoint.

**Implementation:**
Add rate limit check consistent with other mutations:

```ts
export const submitFeedback = mutation({
  handler: async (ctx, args) => {
    const user = await requireMutationUser(ctx);
    await enforceFeedbackRateLimit(ctx, user._id); // 5 per 10 min
    // ... existing logic
  },
});
```

**Test plan:**

- Verify feedback submission still works normally
- Verify rapid repeated submissions are rate-limited

---

### W2-11: Remove Dev-Bypass Extra Query in Production

**Severity:** HIGH
**File:** `convex/auth.ts:73-170`

**Problem:**
Dev-bypass logic runs an extra index query on every authenticated request in
production, even though bypass is never active.

**Implementation:**
Short-circuit the dev-bypass path when the environment variable is not set:

```ts
// At the top of the function:
if (!process.env.NIOTEBOOK_DEV_AUTH_BYPASS) {
  // Skip the bypass query entirely
  return standardAuthPath(ctx);
}
```

**Test plan:**

- Verify auth works correctly in production mode
- Verify dev bypass still works when explicitly enabled in development

---

### W2-12: Fix Analytics Full Table Scans

**Severity:** HIGH
**File:** `convex/analytics.ts`

**Problem:**
Multiple `ctx.db.query("events").collect()` calls without index filters.
These scan the entire events table.

**Implementation:**
Add appropriate index filters:

```ts
// Instead of:
const events = await ctx.db.query("events").collect();

// Use:
const events = await ctx.db
  .query("events")
  .withIndex("by_type", (q) => q.eq("type", eventType))
  .collect();
```

Ensure the required indexes exist in `convex/schema.ts`.

**Test plan:**

- Verify analytics queries return correct results
- Verify query performance with index usage

---

### W2-13: Fix `ingest_started` Event Semantic Naming

**Severity:** HIGH
**File:** `convex/ingest.ts:524-542`

**Problem:**
`transcript_ingest_started` event is emitted in the finalize handler, not at
the start of ingestion — semantically inverted.

**Implementation:**
Rename to `transcript_ingest_completed` or move the emission to the actual
start of ingestion:

```ts
// Option A: Rename to match actual semantics
await emitEvent(ctx, "transcript_ingest_completed", { lessonId });

// Option B: Move emission to the start handler and keep the name
```

**Test plan:**

- Verify analytics events have correct semantics
- Run: `bunx vitest run tests/convex/ingest`

---

## Wave 3 — Quality & Architecture Improvements

### W3-01: Unify `RuntimeLanguage` Type Definition

**Severity:** HIGH
**File:** `src/domain/runtime.ts:1`

**Problem:**
`RuntimeLanguage` type in domain is missing `"sql"` and `"r"` — these are
defined separately in infra with those members.

**Implementation:**
Update the domain type to include all supported languages:

```ts
export type RuntimeLanguage =
  | "javascript"
  | "python"
  | "c"
  | "html"
  | "sql"
  | "r";
```

Remove the duplicate/extended type definition in infra.

**Test plan:**

- Run: `bun run typecheck`
- Verify all language executors still compile

---

### W3-02: Fix Domain-to-Infra Import Violation

**Severity:** HIGH
**File:** `src/domain/lessonEnvironment.ts:7`

**Problem:**
Domain imports from `../infra/runtime/types`, violating dependency inversion.
Domain should never depend on infra.

**Implementation:**
Move the shared types from `src/infra/runtime/types` to `src/domain/`:

```ts
// Move RuntimeLanguage and related types to src/domain/runtime.ts
// Update src/infra/runtime/types to re-export from domain (or import directly)
// Update src/domain/lessonEnvironment.ts to import from ./runtime
```

**Test plan:**

- Run: `bun run typecheck`
- Verify no domain files import from infra

---

### W3-03: Fix `isConvexAuthRequired()` — Narrow `NODE_ENV` Check

**Severity:** HIGH
**File:** `src/app/api/nio/route.ts:54-68`

**Problem:**
Returns false for all non-production `NODE_ENV` — too broad for staging.

**Implementation:**
Require an explicit opt-in flag instead of `NODE_ENV`:

```ts
function isConvexAuthRequired(): boolean {
  if (process.env.NIOTEBOOK_E2E_PREVIEW === "true") return false;
  if (process.env.NIOTEBOOK_SKIP_API_AUTH === "true") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "NIOTEBOOK_SKIP_API_AUTH must not be true in production.",
      );
    }
    return false;
  }
  return true;
}
```

**Test plan:**

- Verify API auth is enforced in staging environments
- Verify dev bypass works only with explicit flag

---

### W3-04: Add Per-Message Content Length Limits

**Severity:** HIGH
**File:** `src/infra/ai/validateNioChatRequest.ts:185-214`

**Problem:**
`recentMessages` content and `lastError` have no per-field length caps.
A malicious client can send 50 messages x unlimited content.

**Implementation:**

```ts
// In parseChatMessage:
if (typeof content !== "string" || content.length > 8000) return null;

// After lastError type check:
if (typeof lastError === "string" && lastError.length > 2000) {
  return { ok: false, error: "lastError exceeds maximum length." };
}
```

**Test plan:**

- Verify normal-length messages are accepted
- Verify oversized messages are rejected with appropriate error
- Run: `bunx vitest run src/infra/ai/validateNioChatRequest`

---

### W3-05: Fix `UserManagement` Unhandled Promise Rejection

**Severity:** HIGH
**File:** `src/ui/admin/UserManagement.tsx:60-65`

**Problem:**
`handleRoleChange` is async with no error handling. Network errors crash silently.

**Implementation:**

```ts
const handleRoleChange = async (userId: string, role: Role): Promise<void> => {
  try {
    await updateRole({ userId: userId as GenericId<"users">, role });
  } catch (error) {
    console.error("Failed to update role:", error);
    // Surface error to user via local state or toast
  }
};
```

**Test plan:**

- Verify role changes work normally
- Verify network errors are surfaced to the admin user

---

### W3-06: Fix `NiotepadEntry` Memo Comparator

**Severity:** HIGH
**File:** `src/ui/niotepad/NiotepadEntry.tsx:397-402`

**Problem:**
Custom memo comparator omits `onStartEdit`, `onSaveEdit`, `onCancelEdit` —
potential stale closure bugs if callback identities change.

**Implementation:**
Either remove the custom comparator (use default shallow comparison) or add
the missing callbacks:

```ts
// Option A: Use default memo (simplest)
export default memo(NiotepadEntry);

// Option B: Add missing callbacks
(prev, next) =>
  prev.entry.id === next.entry.id &&
  prev.entry.updatedAt === next.entry.updatedAt &&
  prev.isEditing === next.isEditing &&
  prev.onDelete === next.onDelete &&
  prev.onStartEdit === next.onStartEdit &&
  prev.onSaveEdit === next.onSaveEdit &&
  prev.onCancelEdit === next.onCancelEdit,
```

**Test plan:**

- Verify niotepad entry editing still works correctly
- Verify no unnecessary re-renders are introduced

---

### W3-07: Replace `FileTreeActions` Native Dialogs

**Severity:** HIGH
**File:** `src/ui/code/FileTreeActions.tsx:57-83`

**Problem:**
`window.prompt`/`window.confirm` block the main thread and break E2E testing.

**Implementation:**
Replace with inline React-state-driven inputs:

```ts
const [renameTarget, setRenameTarget] = useState<string | null>(null);
const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

// Render inline input for rename
// Render confirmation inline for delete
```

**Test plan:**

- Verify file/folder create, rename, delete work with new inline UI
- Verify E2E tests can interact with file tree actions

---

### W3-08: Fix `ApiKeySettings` Silent Error on Remove

**Severity:** MEDIUM
**File:** `src/ui/settings/ApiKeySettings.tsx:59-61`

**Problem:**
`handleRemove` is async but called via `void` operator. Errors are silently
swallowed.

**Implementation:**

```ts
const handleRemove = async (): Promise<void> => {
  try {
    await removeKey({ provider });
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to remove key.");
  }
};
```

**Test plan:**

- Verify key removal works and shows error on failure

---

### W3-09: Fix `WorkspaceGrid` Module-Level Mutable State

**Severity:** MEDIUM
**File:** `src/ui/layout/WorkspaceGrid.tsx:28-50, 122-179`

**Problem:**
Pane state and video time store use module-level mutable variables. Not
concurrent-safe under React 19 Strict Mode.

**Implementation:**
Move pane state into a Zustand store, matching the project's existing pattern:

```ts
// Create src/ui/layout/usePaneStore.ts
export const usePaneStore = create<PaneState>((set, get) => ({
  singlePane: readSinglePane(),
  leftPane: readLeftPane(),
  rightPane: readRightPane(),
  // ...
}));
```

**Test plan:**

- Verify workspace layout persistence works correctly
- Verify HMR does not cause state corruption

---

### W3-10: Fix `VideoPane` Bookmark Timer Cleanup on Lesson Change

**Severity:** MEDIUM
**File:** `src/ui/panes/VideoPane.tsx:246-250`

**Problem:**
Bookmark timer cleanup only fires on unmount, not on `lessonId` change.

**Implementation:**
Add `lessonId` to the dependency array:

```ts
useEffect(() => {
  return () => {
    if (bookmarkTimerRef.current) clearTimeout(bookmarkTimerRef.current);
  };
}, [lessonId]); // Clean up on lesson change too
```

**Test plan:**

- Verify bookmark confirmation does not appear for wrong lesson

---

### W3-11: Remove Dead `useMemo` in `AppShellFrame`

**Severity:** LOW
**File:** `src/ui/shell/AppShell.tsx:18-23`

**Problem:**
Both branches return the identical CSS string — the memo computes a constant.

**Implementation:**
Replace with a static constant:

```ts
const mainClass = "flex w-full flex-1 flex-col overflow-hidden";
```

**Test plan:**

- Verify layout renders correctly

---

### W3-12: Remove Duplicate Video Time Handlers

**Severity:** LOW
**File:** `src/ui/layout/WorkspaceGrid.tsx:302-310`

**Problem:**
`handleVideoTime` and `handleVideoDisplayTime` have identical bodies.

**Implementation:**
Remove `handleVideoTime` and pass `handleVideoDisplayTime` to both props,
or differentiate their implementations per the original design intent.

**Test plan:**

- Verify video time tracking works correctly
- Verify no double-renders during video playback

---

### W3-13: Fix YouTube Transcript Fallback Hardcoded Client Version

**Severity:** MEDIUM
**File:** `src/infra/ai/youtubeTranscriptFallback.ts:26-27`

**Problem:**
Hardcoded `clientVersion: "19.29.37"` will silently fail when YouTube
deprecates this version.

**Implementation:**
Add monitoring/logging when the fallback returns empty:

```ts
const segments = await fetchAllSegments(videoId);
if (segments.length === 0) {
  console.warn(
    `[youtubeTranscriptFallback] Empty response for ${videoId} — ` +
      `Innertube client version ${CLIENT_VERSION} may be deprecated.`,
  );
}
```

**Test plan:**

- Verify warning is logged when segments are empty

---

### W3-14: Fix `useChatThread` Hydration Sentinel Pattern

**Severity:** MEDIUM
**File:** `src/ui/chat/useChatThread.ts:202-210`

**Problem:**
Uses a `useSyncExternalStore` hack for hydration detection. Fragile and
undocumented.

**Implementation:**
Replace with the standard `useEffect` pattern:

```ts
const [isMounted, setIsMounted] = useState(false);
useEffect(() => setIsMounted(true), []);
```

**Test plan:**

- Verify chat history loads correctly from cache
- Verify no hydration mismatch warnings

---

### W3-15: Wrap `handleRun` in `useCallback` in `useCodeExecution`

**Severity:** MEDIUM
**File:** `src/ui/panes/useCodeExecution.ts:54`

**Problem:**
`handleRun` is an async function not wrapped in `useCallback`. Every render
creates a new reference, forcing re-renders of `TerminalPanel`.

**Implementation:**

```ts
const handleRun = useCallback(async (): Promise<void> => {
  // ... existing implementation
}, [activeLanguage, environment, terminalActionsDisabled, lessonId]);
```

**Test plan:**

- Verify code execution works correctly
- Verify TerminalPanel does not re-render unnecessarily

---

## Codebase Strengths (Production-Ready Areas)

These areas require no changes:

- **Type safety** — Strict TypeScript throughout, `no-any` enforced in convex/tests
- **AES-256-GCM encryption** for BYOK API key storage with proper IV generation
- **Hostname allowlisting** on SSRF-prone subtitle fetches
- **COOP/COEP isolation** on the WASM code execution sandbox
- **Convex-side rate limiting** tied to authenticated user identities
- **Input validation** with structured parsing in `validateNioChatRequest`
- **Build-time safety checks** — production build throws if dev-bypass flags are set
- **Test coverage** — Vitest unit tests + Playwright E2E + convex-test integration tests
- **CI pipeline** — Lefthook pre-commit hooks, ESLint 9 flat config, Prettier, typecheck
- **SSE streaming** — Correct abort/close double-guard, 120s timeout, spec-compliant framing
- **Error response safety** — Structured JSON errors with no stack traces to clients
- **Dev auth bypass design** — Multi-layer safety with build-time + runtime + singleton guards
- **Global security headers** — HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy

---

## Implementation Order

```
Wave 1 (Security)     → Branch: fix/oss-security-hardening
  W1-01 through W1-08 → Single PR, thorough review
  ✅ COMPLETED — PR #140, merged to main (commit 10ac30c)

Wave 2 (Correctness)  → Branch: fix/oss-wave-2
  W2-01 through W2-13 → Single PR, test-verified
  ✅ COMPLETED — PR #141, merged to main (commit a11bc7e)
  Note: W2-03 (AdminGuard TOCTOU) and W2-11 (dev bypass) were already fixed in Wave 1.
  Additional fix: Vercel preview guard amended to check VERCEL_ENV !== "preview"
  so E2E preview deployments are not blocked (commit 57de7f5).

E2E Pipeline Fix      → Branch: fix/e2e-preview-seed
  ✅ COMPLETED — PR #142, merged to main
  Clerk lazy-loading, ephemeral Convex previews, seed identity alignment,
  local dev server for tests, AdminGuard grace period, test assertion fixes.
  Stale secrets cleaned up: PREVIEW_DATA_CONVEX_URL, OPENCODE_API_KEY deleted.
  preview-data-refresh.yml disabled (ephemeral previews replace it).

Wave 3 (Quality)      → Branch: refactor/oss-quality-improvements
  W3-01 through W3-15 → Single PR, can be split if large
  ⏳ READY — E2E pipeline blocker resolved
```

Each wave is independently shippable. Waves 1, 2, and the E2E fix have landed.

---

## E2E Pipeline Fix (Resolved)

The Vercel preview guard fix in Wave 2 (commit `57de7f5`) unmasked a
pre-existing E2E pipeline failure on PR branches. This has been resolved
in PR #142 (`fix/e2e-preview-seed`).

### Root Causes Fixed

1. **Clerk SSR crash** — `@clerk/nextjs` crashes at import time without
   `CLERK_SECRET_KEY`. All Clerk imports are now lazy-loaded behind
   `next/dynamic` boundaries.
2. **Convex preview deployment** — The pipeline now creates an ephemeral
   Convex preview per CI run (two-phase deploy: push functions, then set
   env vars).
3. **Seed identity mismatch** — The seed user's `tokenIdentifier` didn't
   match the dev auth bypass identity. Aligned to `niotebook|local-dev`.
4. **Baked-in CONVEX_URL** — Vercel preview has the wrong URL baked at
   build time. The pipeline now starts a local dev server connected to the
   ephemeral Convex preview.
5. **Admin guard timing race** — `AdminGuard` redirected before the dev
   bypass identity could propagate. Added a 3-second grace period.
6. **Test assertion bugs** — Playwright strict mode violations (`.first()`),
   wrong nav labels, missing env var passthrough.

### Result

20 tests pass, 4 intentionally skipped, 0 failures.
The `preview-data-refresh.yml` workflow has been disabled — ephemeral
previews replace the static preview-data deployment.

### Cleanup

- Stale GitHub secrets deleted: `PREVIEW_DATA_CONVEX_URL`, `OPENCODE_API_KEY`
- `preview-data-refresh.yml` disabled (cron removed, `if: false` guard)
