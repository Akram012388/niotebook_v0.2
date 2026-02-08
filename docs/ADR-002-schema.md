# ADR Status: DRAFT

## Title

Convex schema baseline for v0.2

## Context

v0.2 requires a consistent data model to support resume, chat, code snapshots, analytics, and YouTube-synced content. Without a locked schema, implementation will drift and analytics will be inconsistent.

## Decision

Adopt the following baseline Convex schema (names are canonical and match implementation):

### Core content

- `courses`: sourcePlaylistId, title, description?, license, sourceUrl, youtubePlaylistUrl?
- `lessons`: courseId, videoId, title, durationSec, order, subtitlesUrl?, transcriptUrl?, transcriptDurationSec?, segmentCount?, ingestVersion?, transcriptStatus (ok|warn|missing|error), environmentConfig? (JSON — Tier 2 lesson environment: primaryLanguage, starterFiles, allowedLanguages)
- `chapters`: lessonId, title, startSec, endSec
- `transcriptSegments`: lessonId, idx, startSec, endSec, textRaw, textNormalized

### Users + access

- `users`: tokenIdentifier, email?, role (admin/user/guest), inviteBatchId?
- `invites`: code, createdAt, createdByUserId?, expiresAt, status (active|used|expired), usedAt?, usedByUserId?, inviteBatchId, role (user/admin)
  - Alpha auth uses Clerk invite-only; the `invites` table is reserved for a future custom invite-code flow.

### Learning state

- `frames`: userId, lessonId, videoTimeSec, threadId?, codeHash?, updatedAt
- `codeSnapshots`: userId, lessonId, language, code, codeHash, updatedAt
- `lessonCompletions`: userId, lessonId, completionMethod (video|code), completionPct?, completedAt

### Chat

- `chatThreads`: userId, lessonId
- `chatMessages`: threadId, role (user|assistant|system), content, videoTimeSec?, timeWindowStartSec?, timeWindowEndSec?, codeHash?, createdAt, requestId?, provider?, model?, latencyMs?, usedFallback?, contextHash?

### Analytics

- `events`: userId, lessonId?, sessionId?, type, metadata, createdAt

### User feedback

- `feedback`: userId, surface, rating (1-5), text?, createdAt

### System + abuse

- `rateLimits`: scope (invite_redeem|ai_request), subject, windowStartMs, count
  - `invite_redeem` applies only if the custom invite-code flow returns.

### Event taxonomy (v0.2)

- All Phase 0 events are user-scoped and require userId; no system events are defined.
- All events include createdAt and sessionId when applicable.
- Event metadata is structured per event (no untyped blobs).
- Core events:
  - `invite_issued` (inviteId, createdBy)
  - `invite_redeemed` (inviteId, redeemedBy)
  - `auth_email_code_sent` (emailHash) [future]
  - `auth_email_code_verified` (userId) [future]
  - `course_selected` (courseId)
  - `lesson_started` (courseId, lessonId)
  - `video_play` / `video_pause` / `video_seek` (lessonId, videoTimeSec)
  - `code_edit` (lessonId, language)
  - `code_run` (lessonId, language, success, runtimeMs)
  - `nio_message_sent` (lessonId, threadId)
  - `nio_message_received` (lessonId, threadId, latencyMs)
  - `lesson_completed` (lessonId, completionPct)
  - `session_start` / `session_end` (sessionId, durationMs)
  - `runtime_warmup_start` / `runtime_warmup_end` (language, durationMs)
  - `transcript_ingest_started` (lessonId)
  - `transcript_ingest_succeeded` (lessonId, segmentCount, transcriptDurationSec)
  - `transcript_ingest_failed` (lessonId, reason)
  - `transcript_duration_warn` (lessonId, lessonDurationSec, transcriptDurationSec)
  - `share_opened` (surface)
  - `share_copy` (surface)
  - `share_social` (surface, network)
  - `feedback_opened` (surface)
  - `feedback_submitted` (surface, rating[1-5], textLength)
  - `feedback_dismissed` (surface)
- Event metadata envelope fields (schema): inviteId, createdBy, redeemedBy, userId, emailHash, courseId, lessonId, videoTimeSec, language, success, runtimeMs, threadId, latencyMs, completionPct, sessionId, durationMs, segmentCount, transcriptDurationSec, lessonDurationSec, reason, surface, network, rating, textLength.

### Transcript ingest rules

- Deploy-only ingest; idempotent per lessonId when ingestVersion changes (delete + insert).
- Automation: preview-data refresh nightly; prod refresh is manual/gated.
- transcriptStatus values: ok | warn | missing | error.

## Relationships

- `courses` 1→N `lessons`
- `lessons` 1→N `chapters`
- `lessons` 1→N `transcriptSegments`
- `lessons` 1→N `lessonCompletions`
- `users` 1→N `frames`, `codeSnapshots`, `chatThreads`, `events`, `lessonCompletions`, `feedback`
- `chatThreads` 1→N `chatMessages`

## Indexes

- `lessons` by `courseId`
- `chapters` by `lessonId`
- `transcriptSegments` by `lessonId+startSec`
- `transcriptSegments` by `lessonId+idx`
- `frames` by `userId+lessonId`
- `codeSnapshots` by `userId+lessonId+language`
- `lessonCompletions` by `userId+lessonId`
- `chatThreads` by `userId+lessonId`
- `chatMessages` by `threadId`
- `chatMessages` by `threadId+createdAt`
- `chatMessages` by `threadId+requestId`
- `feedback` by `userId`
- `users` by `tokenIdentifier`
- `users` by `inviteBatchId`
- `invites` by `code`
- `invites` by `inviteBatchId`
- `events` by `userId`
- `events` by `type+createdAt`
- `rateLimits` by `scope+subject`

## Access Control (high-level)

- Users may only read/write their own frames, snapshots, threads, messages, events, and completion records.
- Admin role may read analytics across users; invite management is handled in Clerk for alpha.
- Guests only access landing/auth routes.

## Consequences

- Schema defines the backbone for resume, AI context, analytics, and admin cockpit.
- Any schema changes require a new ADR update and plan reference.
