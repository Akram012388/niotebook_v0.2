# Phase 4 Tasks (AI + Chat) — Execution Plan (Locked)

Branch: `phase4-implementation`  
Status: IMPLEMENTED (Phase 4 complete; ops automation added)  
Scope: Phase 4 from `docs/plan.md` + `docs/specs.md` §8, aligned to `docs/ADR-005-nio-prompt.md`, `docs/ADR-003-error-security.md`, and `docs/PRD.md`.

## Non-negotiables

- System prompt is enforced server-side and matches `docs/ADR-005-nio-prompt.md` verbatim.
- Transcript is AI-only context. It must never be injected into user-authored messages.
- Streaming uses SSE (`text/event-stream`) with typed events.
- No layout shift during streaming. Scroll behavior is ChatGPT-class.
- Assistant message is persisted to Convex on completion (final concatenated content only).
- Rate limit is pre-stream HTTP 429 (JSON). SSE `error` is only for mid-stream failures.
- Fallback is allowed only before the first emitted token.
- Convex remains source of truth for resume/thread/frame state.

## Implementation guardrails (Codex kickoff)

- SSE route uses `ReadableStream` and flushes events correctly; include `X-Accel-Buffering: no` and avoid buffering transforms.
- Convex idempotency is enforced via `(threadId, requestId)` index + insert-or-return-existing mutation; client retries reuse the same `requestId` (only regenerate for a new user message).

## Known drift in current codebase (resolved in Phase 4)

- ~~No Next Route Handler exists for AI streaming (`src/app/api/**/route.ts` missing).~~ (resolved)
- ~~Chat persists only user messages (`src/ui/chat/useChatThread.ts` → `convex/chat.ts`); assistant generation/persist is missing.~~ (resolved)
- ~~Transcript injection exists in `src/ui/chat/ChatComposer.tsx` (must be removed).~~ (resolved)
- ~~Transcript window inconsistency: UI uses -60/+120 in `src/ui/transcript/useTranscriptWindow.ts`, while spec requires ±60s.~~ (resolved)
- ~~`convex/chat.ts` message pagination orders oldest-first, breaking “last N messages” semantics for AI context.~~ (resolved)

## Execution order (locked)

P4-00 → P4-01 → P4-02 → P4-03 → P4-05 (stub) → P4-06 → P4-08 → P4-07 → P4-04 (providers) → P4-09 → P4-10 (tests/verify)

Rationale:

- Stub-first gets end-to-end SSE + UX stable without keys.
- Providers are implemented before analytics finalization to validate real behavior + metadata fields.
- Persistence/idempotency is locked before analytics to avoid schema churn later.

---

## P4-00 — API Types + Runtime Validation (Foundation)

Deliverables:

- `src/domain/ai/types.ts` (pure types only)
  - `NioChatRequest`
  - `NioSseEvent` union: `meta | token | done | error`
  - `NioErrorCode` union:
    - `RATE_LIMITED`
    - `VALIDATION_ERROR`
    - `PROVIDER_429`
    - `PROVIDER_5XX`
    - `TIMEOUT_FIRST_TOKEN`
    - `STREAM_ERROR`
- Route-level runtime validation (manual guards; no `any`; narrow `unknown` immediately).

`NioChatRequest` (minimum required fields):

- `requestId: string` (uuid) — idempotency + tracing
- `assistantTempId: string` (uuid) — binds SSE stream to UI placeholder
- `lessonId: string`
- `threadId: string`
- `videoTimeSec: number`
- `userMessage: string`
- `recentMessages: { role: "user"|"assistant"; content: string }[]` (last N)
- `transcript: { startSec: number; endSec: number; lines: string[] }` (untrusted)
- `code: { language: string; codeHash?: string; code?: string }` (optional code payload but structured)

---

## P4-01 — SSE Contract (Fully Specified)

Response headers:

- `Content-Type: text/event-stream; charset=utf-8`
- `Cache-Control: no-cache, no-transform`
- `Connection: keep-alive`
- `X-Accel-Buffering: no`

Events (server → client):

- `meta`
  - `{ requestId, assistantTempId, provider, model, startedAtMs, contextHash, budget, seq: 0 }`
- `token`
  - `{ requestId, assistantTempId, seq, token }`
- `done`
  - `{ requestId, assistantTempId, seq, provider, model, usedFallback, latencyMs, timeToFirstTokenMs, usageApprox, finalText }`
- `error` (mid-stream only; after stream started)
  - `{ requestId, assistantTempId, seq, code, message, provider? }`

Rate limit response:

- Pre-stream: HTTP 429 + JSON `{ error: { code: "RATE_LIMITED", message }, retryAfterMs }`
- Include `Retry-After` header when possible.
- No partial streaming if rate limited.

Operational requirements:

- `assistantTempId` is mandatory for binding tokens to the correct in-flight message.
- `seq` is monotonic integer, starting at 1 for first token event.

---

## P4-02 — Prompt Source of Truth + Anti-Drift

Deliverables:

- `src/domain/nioPrompt.ts` exporting the ADR-005 system prompt verbatim.
- Unit test asserts `docs/ADR-005-nio-prompt.md` equals exported prompt.

Rules:

- System prompt is immutable at runtime.
- Transcript must be clearly labeled as untrusted context (never treated as user role).

---

## P4-03 — Deterministic Context Builder (Pure)

Deliverables:

- `src/domain/nioContextBuilder.ts`:
  - builds provider-agnostic prompt payload
  - deterministic trimming (no summarization)
  - strict ordering and caps
- `contextHash`: sha256 of assembled prompt payload text (route computes; emitted in `meta`).

Approx budget (Phase 4 pragmatic):

- Total tokens: 4096; response cap 1024; context cap 3072.
- Char approximation: 4 chars/token → approx context char budget 12,288 (constant).
- Safety margin enforced.

Budget guard (hardening):

- If `systemPrompt.length > (APPROX_CONTEXT_CHAR_BUDGET - SAFETY_MARGIN)`, fail with `VALIDATION_ERROR` (or adjust constants).

Deterministic trimming rules:

- Never trim system prompt.
- Never truncate current user message (reject overly-large user messages with `VALIDATION_ERROR`).
- Drop oldest messages first.
- Then truncate transcript.
- Then truncate code.
- If still over, drop more old messages.

Context structure:

- `system`: ADR-005 prompt verbatim
- `contextMessage` (system role): lesson meta + window ±60 + untrusted transcript block + code block
- `history`: last N messages
- `user`: current user message

---

## P4-05 — Next Route Handler `/api/nio` (SSE Bridge + Stub)

Deliverables:

- `src/app/api/nio/route.ts`
  - validates request (P4-00)
  - rate limit check before opening stream (429 JSON)
  - uses context builder (P4-03), computes `contextHash`
  - streams SSE events with correct headers
  - enforces fallback gating rule centrally

Fallback gating (route-owned; non-negotiable):

- Buffer primary provider output until first token would be emitted.
- If fallback triggers pre-first-token (429/5xx or timeout ≥10s), switch provider and only then emit `meta` + tokens.
- After first token is emitted, never switch providers.

E2E stub mode (must match real SSE precisely):

- When `NIOTEBOOK_E2E_PREVIEW=true`:
  - emit `meta`
  - emit several `token` events with tiny delays
  - emit `done`
  - identical encoding + headers as real stream
  - no external AI keys required

---

## P4-06 — Premium Chat Streaming UX (ChatGPT-class)

Deliverables:

- Remove transcript injection from `src/ui/chat/ChatComposer.tsx`.
- Add streaming state machine in chat UI:
  - `idle | streaming | error`
  - disable send while streaming (no queue in Phase 4)
- SSE client:
  - parse typed events (`meta/token/done/error`)
  - create assistant placeholder message keyed by `assistantTempId`
  - token buffering with batched UI flush:
    - accumulate tokens in a ref
    - flush on `requestAnimationFrame` or 25–50ms timer to avoid re-render per token
  - reconcile using `done.finalText`
- Scroll behavior updates (`src/ui/chat/ChatScroll.tsx`):
  - pinned-at-bottom during stream uses instant scroll
  - if user scrolls up, stop autoscroll and show a “Scroll to bottom” affordance
- Timestamp formatting:
  - ensure `Lesson • hh:mm:ss` formatting matches video pane formatting
- Transcript window unified to ±60s everywhere.

Explicit deferrals (unless requested):

- “Stop generating” control (AbortController) and partial persistence rules.

---

## P4-08 — “Last N Messages” Semantics (Convex + UI alignment)

Deliverables:

- Fix `convex/chat.ts` to fetch newest-first for context, then normalize ascending for display.
- Ensure the same slice (last N) is used for:
  - what is shown in UI
  - what is sent in `recentMessages` to the route

---

## P4-07 — Persistence + Idempotency + Provider Metadata (Convex)

Decisions (locked):

- Persist only final assistant content (no chunk storage in Phase 4).
- Persist provider metadata on assistant message:
  - `requestId`, `provider`, `model`, `latencyMs`, `usedFallback`, `contextHash`
- Idempotency:
  - uniqueness by `(threadId, requestId)`
  - on retry, return existing assistant message rather than duplicating

Deliverables:

- Convex schema changes + index
- Mutation behavior: insert-or-return-existing for assistant completion

---

## P4-04 — Real Providers + Streaming Adapters (Gemini primary, Groq fallback)

Deliverables:

- `src/infra/ai/geminiStream.ts` (Gemini 3 Flash preview streaming)
- `src/infra/ai/groqStream.ts` (Groq llama-3.3-70b-versatile streaming)
- unified adapter interface: async iterator producing tokens + structured errors

Constraints:

- Route owns fallback gating.
- Adapters must not yield “fake tokens” before real content.

---

## P4-09 — Analytics + Fallback Visibility

Deliverables:

- Emit:
  - `nio_message_sent` when user message is created
  - `nio_message_received` when assistant message is persisted (server-authoritative if possible)
- Add and emit `ai_fallback_triggered` event:
  - include `fromProvider`, `toProvider`, `reason`, `lessonId`, `threadId`
- `done.usedFallback` remains client-visible signal.

---

## P4-10 — Tests + Verification (Exit Criteria)

Unit tests:

- ADR-005 anti-drift prompt test
- Context builder determinism + trimming order + budget guard
- SSE encoding/parsing test
- Fallback gating test (pre-first-token only)

E2E:

- Extend `tests/e2e/smoke.e2e.ts`:
  - send chat message
  - assert chat input submission succeeds (stub optional via `NIOTEBOOK_E2E_PREVIEW`)

Manual dev test:

- Run once with at least one real provider key to validate:
  - SSE stability
  - first token timing
  - fallback behavior
  - persistence metadata correctness

Exit criteria (must pass):

1. `/api/nio` streams SSE reliably in dev and in `NIOTEBOOK_E2E_PREVIEW=true` stub mode.
2. Server enforces ADR-005 prompt; anti-drift test blocks changes.
3. Transcript never enters user message; it only travels as structured context.
4. Assistant messages persist on completion with metadata, and retries do not duplicate messages.
5. “Last N messages” used for context are exactly the last N displayed.
6. E2E smoke passes without real AI keys.
7. Manual dev test succeeds with at least one provider key.

---

## Phase 4 Veracity Review (2026-01-26)

Phase 4 Veracity (Against docs/phase4-tasks.md)

- Branch state looks clean and current: phase4-implementation is clean and matches origin/phase4-implementation.
- All Phase 4 core deliverables exist and are wired end-to-end:
  - Types + validation: src/domain/ai/types.ts, src/infra/ai/validateNioChatRequest.ts
  - Prompt SSoT + anti-drift: src/domain/nioPrompt.ts, tests/unit/nio-prompt.test.ts, docs/ADR-005-nio-prompt.md
  - Context builder: src/domain/nioContextBuilder.ts, tests/unit/nio-context-builder.test.ts
  - SSE contract + parsing: src/infra/ai/nioSse.ts, tests/unit/nio-sse.test.ts
  - /api/nio SSE route + stub mode + fallback gate: src/app/api/nio/route.ts, src/infra/ai/fallbackGate.ts, tests/unit/nio-route-sse.test.ts, tests/unit/ai-fallback-gate.test.ts
  - Providers: src/infra/ai/geminiStream.ts, src/infra/ai/groqStream.ts
  - Persistence + idempotency: convex/chat.ts, convex/schema.ts, tests/unit/chat-idempotency.test.ts
  - UI streaming UX + scroll affordance + no transcript injection: src/ui/chat/useChatThread.ts, src/ui/chat/ChatScroll.tsx, src/ui/chat/ChatComposer.tsx, src/ui/panes/AiPane.tsx
  - Transcript window unified to ±60s: src/ui/transcript/useTranscriptWindow.ts
  - E2E smoke covers stub stream: tests/e2e/smoke.e2e.ts
- The “Known drift” list in docs/phase4-tasks.md#known-drift-in-current-codebase appears fixed in code (route exists, assistant persistence exists, transcript injection removed, window is ±60s, chat pagination is newest-first via .order("desc")).

Issues / Discrepancies Found

- Doc drift (northstar mismatch): docs/phase4-tasks.md still says “Status: READY TO IMPLEMENT” and still lists “Known drift” items that are already resolved in the codebase. If this doc is the authoritative latest record, it’s currently stale.
- SSE sequencing bug: src/app/api/nio/route.ts emits SSE error with seq: 1 even when an error can occur after multiple tokens; this violates the “seq is monotonic” rule from docs/phase4-tasks.md (§P4-01).
- Convex auth boundary risk: src/app/api/nio/route.ts calls Convex mutations via ConvexHttpClient without passing user auth. With NIOTEBOOK_DEV_AUTH_BYPASS disabled (intended for prod per docs/env-requirements.md), rate limiting + persistence + server-side fallback analytics can silently fail (caught/ignored in several places). This is the biggest “real-world deploy” concern.
- Script strictness mismatch: scripts/verify-phase4.sh ignores typecheck failures (bun run typecheck || true), which is inconsistent with CI gating in .github/workflows/ci.yml and the intent of docs/ADR-004-cicd.md.
- ADR-003 gap (if treated as required now): docs/ADR-003-error-security.md calls for jailbreak neutralization before model call; I don’t see an implementation of that in the /api/nio path yet.

Resolution note (2026-01-29): all items above have been addressed in follow-up commits; see completed follow-up tasks and ops automation updates below.

CI/CD + E2E Pipeline Consistency

- CI checks align with docs/ADR-004-cicd.md: .github/workflows/ci.yml runs lint, check:any, check:unknown, typecheck, test, build.
- E2E flow is coherent with Phase 4 stub mode: .github/workflows/e2e.yml seeds + sets preview flags and runs test:e2e; tests/e2e/smoke.e2e.ts asserts the stubbed response text.

PR Readiness

- For a “Phase 4 implementation” PR: mostly ready, but I’d block on (1) the SSE error.seq monotonicity issue, and (2) explicitly resolving/deciding the /api/nio → Convex auth story (otherwise production correctness of persistence/rate limiting is fragile).
- One decision I need from you: is this PR intended to be production-safe with NIOTEBOOK_DEV_AUTH_BYPASS OFF? My recommended default is “yes”; if “no (preview/dev only)”, then we should at least document that clearly and still fix the SSE seq issue.

---

## Phase 4 Follow-up Tasks (2026-01-26)

- [x] Validate transcript availability end-to-end (Convex window query → UI payload → `/api/nio`) and add preview-data refresh automation to keep transcripts populated.
- [x] Enforce monotonic SSE `seq` for `error` events (use current token seq when streaming fails mid-stream).
- [x] Resolve `/api/nio` Convex auth strategy for production (prod requires auth header; preview/dev uses bypass) and ensure rate limit + persistence + analytics do not silently fail.
- [x] Implement ADR-003 prompt injection neutralization prior to provider call (minimal, deterministic; no drift).
- [x] Update ChatScroll “Scroll to bottom” control to ChatGPT-style circular down-arrow button (appearance only; no behavior changes).
- [x] Add ChatGPT-style “thinking” indicator (pulsing dot) while streaming before first token.
- [x] Align `scripts/verify-phase4.sh` with CI strictness (do not ignore typecheck failures).

## Ops Automation Updates (2026-01-29)

- [x] Add nightly preview-data refresh workflow (deploy + ingest + hard-fail transcript verification).
- [x] Add manual prod refresh workflow (deploy + ingest + hard-fail transcript verification; confirm gate).
- [x] Add preview-data cleanup cron (7-day retention; guarded by `NIOTEBOOK_PREVIEW_DATA=true`).
- [x] Remove per-run Vercel preview env rewiring from E2E workflow; use preview-data backend instead.
- [x] Remove `vercel.json` build override and use conditional Vercel build command in Project Settings.
