# Phase 4 Tasks (AI + Chat) — Execution Plan (Locked)

Branch: `phase4-implementation`  
Status: READY TO IMPLEMENT  
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

## Known drift in current codebase (must be fixed in Phase 4)

- No Next Route Handler exists for AI streaming (`src/app/api/**/route.ts` missing).
- Chat persists only user messages (`src/ui/chat/useChatThread.ts` → `convex/chat.ts`); assistant generation/persist is missing.
- Transcript injection exists in `src/ui/chat/ChatComposer.tsx` (must be removed).
- Transcript window inconsistency: UI uses -60/+120 in `src/ui/transcript/useTranscriptWindow.ts`, while spec requires ±60s.
- `convex/chat.ts` message pagination orders oldest-first, breaking “last N messages” semantics for AI context.

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
  - assert streamed assistant output appears (stub mode; no keys)

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
