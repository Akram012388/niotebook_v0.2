# ADR Status: DRAFT

## Title
Convex schema baseline for v0.2

## Context
v0.2 requires a consistent data model to support resume, chat, code snapshots, analytics, and YouTube-synced content. Without a locked schema, implementation will drift and analytics will be inconsistent.

## Decision
Adopt the following baseline Convex schema (names are canonical):

### Core content
- `courses`: playlist-level metadata (source playlist ID, title, description, license, source URL)
- `lessons`: video-level metadata (courseId, video ID, title, duration, order)
- `chapters`: timestamped segments within a lesson (lessonId, title, startSec, endSec)

### Users + access
- `users`: profile + role (admin/user/guest)
- `invites`: invite codes (createdBy, redeemedBy, status, createdAt, expiresAt)

### Learning state
- `frames`: last known frame per user+lesson (lessonId, userId, videoTimeSec, codeHash?, threadId)
- `codeSnapshots`: per user+lesson+language (code, language, updatedAt, codeHash)

### Chat
- `chatThreads`: one per user+lesson
- `chatMessages`: message history (threadId, role, content, videoTimeSec, timeWindow, codeHash?)

### Analytics
- `events`: immutable event log (userId, lessonId?, type, metadata, createdAt)

## Relationships
- `courses` 1→N `lessons`
- `lessons` 1→N `chapters`
- `users` 1→N `frames`, `codeSnapshots`, `chatThreads`, `events`
- `chatThreads` 1→N `chatMessages`

## Indexes
- `lessons` by `courseId`
- `chapters` by `lessonId`
- `frames` by `userId+lessonId`
- `codeSnapshots` by `userId+lessonId+language`
- `chatThreads` by `userId+lessonId`
- `chatMessages` by `threadId`
- `events` by `userId` and `type+createdAt`

## Access Control (high-level)
- Users may only read/write their own frames, snapshots, threads, messages, and events.
- Admin role may read analytics across users and manage invites.
- Guests only access landing/auth routes.

## Consequences
- Schema defines the backbone for resume, AI context, analytics, and admin cockpit.
- Any schema changes require a new ADR update and plan reference.
