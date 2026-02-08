# Niotebook Convex Backend

Serverless backend for Niotebook v0.2 — real-time queries, mutations, and scheduled jobs powered by [Convex](https://docs.convex.dev).

## Schema Overview

Defined in `schema.ts`. All tables use Convex's automatic `_id` and `_creationTime` fields.

| Table                | Description                                                       |
| -------------------- | ----------------------------------------------------------------- |
| `courses`            | Course metadata (title, description, source playlist, license)    |
| `lessons`            | Individual lessons with video ID, duration, environment config    |
| `chapters`           | Time-based chapter markers within lessons                         |
| `transcriptSegments` | Normalized transcript text segments indexed by lesson and time    |
| `users`              | User profiles with Clerk token identifier, email, and role        |
| `invites`            | Invite codes with expiry, batch tracking, and role assignment     |
| `frames`             | Resume snapshots — video time, thread, code hash per user/lesson  |
| `lessonCompletions`  | Lesson completion records with method and percentage              |
| `codeSnapshots`      | Versioned code snapshots with content hashing per user/lesson     |
| `chatThreads`        | AI chat threads scoped to user + lesson                           |
| `chatMessages`       | Chat messages with role, provider metadata, and context hashes    |
| `events`             | Analytics event log (typed, with rich metadata)                   |
| `feedback`           | User feedback with category, rating, and optional notes           |
| `rateLimits`         | Sliding-window rate limit counters (invite redemption, AI requests) |

## Auth Model

Authentication flows through Clerk → JWT → Convex identity:

1. Clerk issues JWTs configured in `auth.config.ts`
2. Convex validates the JWT and provides `ctx.auth.getUserIdentity()`
3. `users.ts` maps the Clerk `tokenIdentifier` to a Convex user record
4. Roles: `admin`, `user`, `guest` — enforced in queries/mutations

## Key Function Files

| File                   | Purpose                                                    |
| ---------------------- | ---------------------------------------------------------- |
| `content.ts`           | Course and lesson queries (catalog, detail, by-course)     |
| `chat.ts`              | Chat thread and message management                         |
| `resume.ts`            | Resume data — last active lesson per course                |
| `lessonCompletions.ts` | Mark lessons complete, query completion counts             |
| `crons.ts`             | Scheduled jobs (e.g., maintenance tasks)                   |
| `events.ts`            | Analytics event logging                                    |
| `feedback.ts`          | Submit feedback (user) + list all (admin)                  |
| `invites.ts`           | Invite code CRUD — generate, redeem, revoke, list (admin)  |
| `users.ts`             | User bootstrap, profile, role management (admin)           |
| `ops.ts`               | Admin analytics — active users, sessions, AI requests, KPIs |
| `ingest.ts`            | Course/lesson ingest mutation for seeding data             |
| `transcripts.ts`       | Transcript segment queries                                 |
| `maintenance.ts`       | Data maintenance utilities                                 |
| `rateLimits.ts`        | Sliding-window rate limiting                               |
| `idUtils.ts`           | ID validation and conversion utilities                     |

## Development

Start the Convex dev server alongside Next.js:

```bash
bun run dev:convex
```

Push schema and functions to a deployment:

```bash
npx convex dev      # Watch mode (development)
npx convex deploy   # Production deployment
```

See the [Convex docs](https://docs.convex.dev) for more details.
