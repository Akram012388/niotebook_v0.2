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
- **Magic link expired**: prompt resend with single CTA.
- **Runtime warm-up slow**: show “preparing runtimes…” inline status; no blocking modals.

### Auth + roles
- Invite codes are single-use; default TTL is 7 days.
- Role enforcement is server-side in Convex mutations/queries.
- Admin routes require explicit role check; guests never access workspace.

### Rate limiting + abuse
- Throttle invite redemption attempts: 5 attempts/hour/IP (with backoff).
- Throttle AI requests: 20 requests/10 minutes/user.

### Prompt injection + AI safety
- System prompt is immutable and enforced server-side.
- User prompts are scoped to lesson/time/code; off-topic is refused.
- Strip or neutralize jailbreak patterns before model call.

### Boundary validation (no any/unknown)
- All external inputs are validated at the infra boundary before reaching domain logic.
- Use Zod as the canonical schema validator for v0.2.
- Invalid payloads fail fast with safe errors; no raw data persists.

### Data privacy
- Store minimal data required for resume and analytics.
- Analytics events exclude raw code unless explicitly needed.

## Consequences
- UX remains premium under failure.
- Access control and AI guardrails are consistent and enforceable.
- Implementation must map every failure mode to a UI state.
