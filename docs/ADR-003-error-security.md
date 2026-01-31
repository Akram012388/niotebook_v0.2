# ADR Status: DRAFT

## Title

Error handling + security baseline for v0.2

## Context

Premium UX and strict scope require defensive programming. Failure modes must be handled explicitly, and access control must be enforced server-side.

## Decision

Define baseline failure modes, degradation paths, and security rules for v0.2.

### Failure modes + degradation

- **YouTube API sync fails**: show cached metadata; retry with backoff; surface non-blocking banner.
- **Transcript fetch/mapping fails**: set transcriptStatus=missing or error; proceed without transcript context; retry with backoff; log for admin review.
- **Transcript duration mismatch (>120s)**: set transcriptStatus=warn; emit transcript_duration_warn; proceed.
- **YouTube playback error**: show retry CTA; preserve code + chat state.
- **Convex unreachable**: switch to IndexedDB cache; queue writes; show subtle “syncing” badge.
- **AI provider down**: fail over to fallback on 5xx/429 or timeout ≥10s; if both fail, show non-blocking error and keep chat input enabled for retry.
- **Email code expired**: prompt resend with single CTA.
- **Runtime warm-up slow**: show “preparing runtimes…” inline status; no blocking modals.

### Auth + roles

- Alpha uses Clerk invite-only auth; invitations are managed in Clerk.
- Role enforcement is server-side in Convex mutations/queries.
- Admin routes require explicit role check; guests never access workspace.
- Guests cannot access course content or transcripts; content/transcript queries require authenticated identity.

### Rate limiting + abuse

- Throttle invite redemption attempts only if custom invite-code flow returns.
- Throttle AI requests: 20 requests/10 minutes/user.

### Prompt injection + AI safety

- System prompt is immutable and enforced server-side.
- User prompts are scoped to lesson/time/code; off-topic is refused.
- Strip or neutralize jailbreak patterns before model call.

### Code execution sandbox (Tier 2)

- Wasmer/WASIX runs inside an isolated iframe (`/editor-sandbox`) with COOP/COEP headers. The main app never receives these headers — Clerk, Convex, and YouTube embeds are unaffected.
- Communication between parent and sandbox iframe uses `window.postMessage()` with origin validation. Messages are typed (`SandboxMessage` / `SandboxResponse`).
- JavaScript execution uses `Function()` inside a sandboxed iframe (no `eval` on the main app thread).
- The VFS enforces file size limits (1MB per file, 50MB total) to prevent memory exhaustion.

### Boundary validation (no any/unknown)

- All external inputs are validated at the infra boundary before reaching domain logic.
- Use Convex validators plus lightweight guards; schema libraries like Zod are optional (not required in v0.2).
- Invalid payloads fail fast with safe errors; no raw data persists.

### Data privacy

- Store minimal data required for resume and analytics.
- Analytics events exclude raw code unless explicitly needed.

## Consequences

- UX remains premium under failure.
- Access control and AI guardrails are consistent and enforceable.
- Implementation must map every failure mode to a UI state.
