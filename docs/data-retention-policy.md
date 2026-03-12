# Data Retention Policy

**Last updated:** 2026-03-09
**Next review:** 2027-03-09

This document describes how long Niotebook stores different types of user data, what automated cleanup runs, and how deletion requests are handled. It is written for engineers and is not a substitute for a legal privacy policy.

---

## 1. User Account Data (`users` table)

Retained while the account is active. Fields stored: Clerk token identifier, email address, and role.

Deletion trigger: Clerk webhook on account closure, or manual admin action via the Convex dashboard. When a user record is deleted, dependent rows (API keys, chat threads, frames, completions, feedback, rate-limit buckets) must also be deleted. There is no automated cascade today — this is a manual process (see section 10).

---

## 2. Event Logs (`events` table)

Stores behavioral events such as code runs, video seeks, and AI requests. Each row has a `createdAt` timestamp.

**Retention window:**

- **Preview / staging environments** (where `NIOTEBOOK_PREVIEW_DATA=true`): rows older than **7 days** are deleted nightly by the `preview-data-cleanup` cron (runs at 02:00 UTC).
- **Production:** no automated cleanup is currently configured. Events accumulate indefinitely. A production retention window should be defined — suggested value is **90 days** for operational analytics. (Review needed before production launch.)

The same cron pass also deletes stale `chatMessages` rows (see the Chat Messages section).

Note: the `metadata` object may contain `emailHash` (hashed, not plaintext) but never raw email addresses.

---

## 3. Chat Messages (`chatMessages` table)

Stores individual AI chat turns tied to a thread. Each row has a `createdAt` timestamp.

**Retention window:** same as event logs (section 2) — 7 days in preview environments; no production cleanup configured today. A 90-day window is a reasonable starting point and should be confirmed before launch.

Cleanup is performed by the same `preview-data-cleanup` cron described in the Events section, in the same database transaction pass.

---

## 4. Chat Threads (`chatThreads` table)

A thread is a parent record linking a user to a lesson. Threads have no timestamp of their own; their age is implied by the messages inside them.

Threads with no remaining messages after a cleanup pass become orphaned. There is currently no orphan-cleanup step. This should be added when the production message cleanup is implemented.

A thread with no remaining messages should be deleted in the same cleanup pass.

---

## 5. AI Rate Limits (`rateLimits` table)

Stores rolling-window counters for three scopes: `ai_request`, `event_log`, and `feedback`. Each row has a `windowStartMs` timestamp marking when the current window opened.

**Retention window:** 24 hours. Rows whose window has expired are short-lived by design. A TTL cleanup cron (Wave 4) will delete expired buckets automatically. Until that cron is deployed, stale rows accumulate but are functionally inert — the application ignores buckets outside the current window.

No personal content is stored in this table; `subject` is a user ID or IP string.

---

## 6. Code Frames and Snapshots (`frames` and `codeSnapshots` tables)

**`frames`** — tracks the user's video position and active thread per lesson. Has an `updatedAt` timestamp.

**`codeSnapshots`** — stores the last-known code content per user/lesson/language. Has an `updatedAt` timestamp. Unlike `frames`, this table holds actual user code and is more sensitive from a data-minimization standpoint.

**Retention window:** 30-day TTL for both tables (Wave 4 addition). A cleanup cron will delete rows not updated in the past 30 days. The user can re-create a frame or snapshot simply by returning to a lesson.

Until the Wave 4 cron is deployed, both tables retain data indefinitely.

---

## 7. Virtual Filesystem (VFS)

The VFS is **browser-local only**. It is serialized to IndexedDB in the user's browser and is never sent to the Convex backend.

There is no server copy. Clearing browser storage (site data, IndexedDB) permanently removes the user's file tree. No server-side deletion is needed for the VFS during account closure.

---

## 8. API Keys (`userApiKeys` table)

Stores user-supplied AI provider keys (Gemini, OpenAI, Anthropic). Keys are encrypted at rest using AES-256-GCM before being written to Convex. The `iv` (initialization vector) and `encryptedKey` fields are stored separately; the plaintext key is never persisted.

**Retention:** keys are retained while the user account is active. On account deletion, the corresponding rows must be deleted as part of the manual erasure process (section 10).

`keyHint` stores a short suffix of the key for display purposes only (e.g., `...ab12`).

---

## 9. No-Production-Data Policy

Dev and preview environments must not contain real user data.

- The `preview-data-cleanup` cron is gated behind the `NIOTEBOOK_PREVIEW_DATA=true` environment variable. This variable must **not** be set in production.
- Seed scripts and test fixtures must use synthetic data only.
- Preview deployments on Vercel are provisioned with a separate Convex project; they must never point to the production Convex deployment URL.
- If real data is accidentally introduced into a non-production environment, it should be purged immediately via the Convex dashboard and the incident noted in the changelog.

---

## 10. GDPR / Right to Erasure

When a user requests deletion of their data, the following must be removed:

| Table               | Action                                                 |
| ------------------- | ------------------------------------------------------ |
| `users`             | Delete the row                                         |
| `userApiKeys`       | Delete all rows for `userId`                           |
| `chatMessages`      | Delete all rows in threads owned by the user           |
| `chatThreads`       | Delete all rows for `userId`                           |
| `frames`            | Delete all rows for `userId`                           |
| `codeSnapshots`     | Delete all rows for `userId`                           |
| `lessonCompletions` | Delete all rows for `userId`                           |
| `feedback`          | Delete all rows for `userId`                           |
| `rateLimits`        | Delete all rows where `subject` is the user's ID       |
| `events`            | Delete all rows for `userId`                           |
| VFS (IndexedDB)     | User must clear browser storage; no server copy exists |
| Clerk               | Delete the Clerk user record to revoke auth            |

**Current process:** manual, performed by an admin via the Convex dashboard and the Clerk dashboard. There is no automated erasure API today.

**Future:** an automated erasure mutation triggered by a Clerk `user.deleted` webhook is the intended implementation. This should be prioritized before scaling beyond the current user base.

Retention of anonymized aggregate data (e.g., aggregate course completion counts with no user linkage) is outside the scope of erasure.

---

## 11. Content Data (courses, lessons, transcripts, chapters)

Course catalog content — `courses`, `lessons`, `chapters`, `transcriptSegments` — is editorial/instructional data, not user data. It is retained indefinitely and is not subject to user deletion requests. No personal data is stored in these tables.

---

## 12. Feedback (`feedback` table)

User-submitted ratings and optional free-text notes. Retained while the account is active. The free-text `notes` field may contain personal content and is included in the erasure table (section 10).

---

## 13. Review Cadence

This document should be reviewed:

- Annually (next scheduled review: 2027-03-09)
- When any table is added to or removed from `convex/schema.ts`
- When a new data category (PII, payment, health) is introduced
- Before any regulatory filing or external audit

Owner: engineering lead. Changes should be committed alongside the schema change that triggers the review.
