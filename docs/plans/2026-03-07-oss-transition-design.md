# OSS Transition Design

**Date:** 2026-03-07
**Status:** Approved
**Author:** Akram

## Overview

Niotebook transitions from an invite-only alpha product to a fully open-source project
(MIT license) with a publicly accessible hosted version. The application remains free to
use. The AI assistant (Nio) requires users to bring their own API key — the project bears
no AI inference costs.

The transition is structured as two sequential tracks:

- **Track 1 — OSS Publication:** No code changes. Adds license, README, CONTRIBUTING,
  `.env.example`, runs a secrets scan, and makes the repository public.
- **Track 2 — Open Access + BYOK Nio:** The substantive engineering milestone. Removes
  the invite gate, implements multi-provider BYOK AI with encrypted key storage, and
  simplifies the admin console.

---

## Decisions

| Topic                  | Decision                                                               |
| ---------------------- | ---------------------------------------------------------------------- |
| License                | MIT                                                                    |
| Auth provider          | Keep Clerk (remove invite gate, enable public sign-up)                 |
| Backend                | Keep Convex (no migration)                                             |
| AI cost model          | Bring Your Own Key — no hosted AI, no cost borne by the project        |
| Supported AI providers | Gemini, OpenAI, Anthropic                                              |
| Key storage            | Encrypted in Convex (AES-256-GCM), never returned to client after save |
| Repository history     | Kept as-is — authentic learning journey, no rewriting                  |
| Admin console          | Retire invites panel, keep analytics + users + feedback                |

---

## Track 1 — OSS Publication

All changes land in a single commit. No application code is modified.

### Files to create

**`LICENSE`**
MIT License, dated 2026, Akram.

**`README.md`** (root-level, replaces or supplements `docs/README.md`)
Sections:

- What Niotebook is (one paragraph)
- Screenshots or demo link
- Tech stack (Next.js 16, Convex, Clerk, Tailwind 4, Bun)
- Local setup (prerequisites, clone, install, env vars, dev commands)
- Required environment variables — table with var name, where to get it, required/optional
- Self-hosting notes: Clerk free tier setup, Convex free tier setup
- Content licensing notice: CS50 course content is CC BY-NC-SA (non-commercial).
  Self-hosters are responsible for compliance with the original license.
- Contributing pointer

**`CONTRIBUTING.md`**

- Branch strategy: feature branches, never push to main directly
- Test command: `bun run test`
- Build command: `bun run build`
- Code style: see `docs/guidelines.md`
- PR expectations: passing lint + typecheck + tests

**`.env.example`**
All variables from `docs/env-requirements.md` with empty values and inline comments.
Includes the new `NIOTEBOOK_KEY_ENCRYPTION_SECRET` variable added in Track 2.

### Pre-publication security scan

Run before making the repository public:

```bash
git log --all -p | grep -iE "(api_key|secret|token|password)\s*[=:]\s*['\"]?[A-Za-z0-9_\-]{16,}"
```

Or use `trufflehog git file://.` for a more thorough scan.

The known Figma API key was already removed and rotated. This scan is verification only.
No history rewriting regardless of findings for anything already invalidated.

---

## Track 2 — Open Access + BYOK Nio

A single feature branch. All changes ship together.

### 2.1 Auth — Remove Clerk Invite Gate

**Clerk dashboard change (manual):**

- Re-enable public sign-up in the Clerk dashboard
- Remove any invite-only restrictions

**Code removals:**

- `convex/schema.ts` — drop `invites` table; drop `inviteBatchId` from `users` table
- `convex/invites.ts` (or equivalent) — delete invite mutation file(s)
- `src/app/admin/` — remove the Invites panel and all invite-related UI
- Any invite redemption UI in `src/ui/auth/`
- `inviteBatchId`-based cohort analytics from admin dashboard

**Schema change to `users` table:**

- Remove `inviteBatchId` field
- Remove `inviteBatchId` index
- Add `activeAiProvider: v.optional(v.union(v.literal("gemini"), v.literal("openai"), v.literal("anthropic")))` — tracks which provider Nio uses for this user

**User roles:**

- `admin` and `user` remain unchanged
- `guest` role retired — no longer meaningful without an invite gate
- `NIOTEBOOK_ADMIN_EMAILS` allowlist unchanged

**Net UX:** New users visit the site, click Sign In, enter email, enter OTP code, land in
the app. No invite required. The sign-in page and boot sequence animation are untouched.

### 2.2 AI — BYOK Multi-Provider with Encrypted Convex Storage

#### New Convex table: `userApiKeys`

```ts
userApiKeys: defineTable({
  userId: v.id("users"),
  provider: v.union(
    v.literal("gemini"),
    v.literal("openai"),
    v.literal("anthropic"),
  ),
  encryptedKey: v.string(), // AES-256-GCM encrypted, base64-encoded
  iv: v.string(), // random IV per write, base64-encoded
  keyHint: v.string(), // last 4 chars of raw key, shown in settings UI
  updatedAt: v.number(),
}).index("by_userId_provider", ["userId", "provider"]);
```

One row per provider per user. Saving a key for an existing provider overwrites it.

#### Encryption

- Algorithm: AES-256-GCM
- Encryption key source: `NIOTEBOOK_KEY_ENCRYPTION_SECRET` env var (32-byte random value,
  set on Vercel and in `.env.local`, documented in `.env.example`)
- Encryption and decryption happen only in Convex actions (server-side)
- The raw API key is never stored in Convex in plaintext
- The raw API key is never returned to the client after the initial save request
- Each write generates a fresh random IV

#### New Convex mutations and actions

- `userApiKeys.save(provider, key)` — validates key is non-empty, encrypts, upserts row,
  derives `keyHint` (last 4 chars of raw key). Also sets `users.activeAiProvider` to this
  provider if the user has no active provider yet (first key = auto-selected).
- `userApiKeys.remove(provider)` — deletes the row. If the removed provider was the active
  one, auto-selects another saved provider or clears `activeAiProvider`.
- `userApiKeys.listHints()` — returns `{ provider, keyHint }[]` for the settings UI.
  Never returns the encrypted key or IV.
- `userApiKeys.setActiveProvider(provider)` — updates `users.activeAiProvider`. Only
  callable if the user has a saved key for that provider.
- `userApiKeys.resolveForRequest()` — internal Convex action called by the API route.
  Reads the user's `activeAiProvider`, fetches the corresponding `userApiKeys` row,
  decrypts the key using `NIOTEBOOK_KEY_ENCRYPTION_SECRET`, returns `{ provider, key }`.
  Never exposed as a public mutation.

#### API route changes (`/api/nio/route.ts`)

- `GEMINI_API_KEY` and `GROQ_API_KEY` removed as operational dependencies (may remain in
  `.env.example` as optional for local dev convenience, clearly marked deprecated)
- On each request: calls `userApiKeys.resolveForRequest()` via the authenticated Convex
  client to obtain `{ provider, key }`
- If no key found: returns SSE error event with code `NO_API_KEY`
- Routes to the appropriate streamer based on resolved provider:
  - `"gemini"` → `streamGemini(messages, key)`
  - `"openai"` → `streamOpenAI(messages, key)` (new)
  - `"anthropic"` → `streamAnthropic(messages, key)` (new)
- Fallback logic (Gemini → Groq) is retired — with BYOK, the user's chosen provider is
  used directly. If it fails, the error surfaces to the user.
- Rate limiting remains — now protects against Convex abuse, not API key exhaustion

#### New AI streamers

**`src/infra/ai/openaiStream.ts`**

- Uses OpenAI Chat Completions streaming API
- Model: `gpt-4o-mini` (default, cost-effective for learners)
- Same `AsyncIterable<string>` interface as `geminiStream.ts`
- Returns `{ stream, provider: "openai", model }` matching `NioProviderStreamResult`

**`src/infra/ai/anthropicStream.ts`**

- Uses Anthropic Messages API streaming
- Model: `claude-haiku-4-5` (default, fast and cost-effective)
- Same interface as above

Both streamers accept `{ messages, maxOutputTokens, apiKey }` — the user-supplied key
is passed through, never logged.

#### Nio chat gate

When the user has no `activeAiProvider` (no key configured):

- The chat input area is replaced with an inline prompt:
  _"Add an API key in Settings to chat with Nio"_ with an arrow link to the settings panel
- No modal, no blocking screen — contextual, non-intrusive
- All other workspace features (editor, video, niotepad) remain fully functional

### 2.3 Settings UI — API Key Panel

**Location:** Workspace control center (existing settings area with theme toggle and
layout pickers). New "Nio" section added above or below existing controls.

**Component:** `src/ui/settings/ApiKeySettings.tsx`

**Layout:**

```
Nio AI Provider
───────────────────────────────────────
Active:  [● Gemini]  [ OpenAI]  [ Anthropic]

Gemini API Key
[••••••••••••k3pX]  [Edit]  [Remove]

OpenAI API Key
[Not configured]    [Add key ▾]

Anthropic API Key
[Not configured]    [Add key ▾]
```

**Behaviour:**

- Provider selector shows only; clicking a configured provider sets it as active
  (calls `userApiKeys.setActiveProvider`)
- Unconfigured providers are shown but not selectable in the active selector
- "Edit" on a saved key clears the masked hint and shows a live text input; Save
  calls `userApiKeys.save`, input clears, hint updates
- "Add key" expands an inline input for that provider row
- "Remove" calls `userApiKeys.remove`; if it was the active provider, the selector
  auto-updates
- Switching active provider takes effect on the next Nio message — no reload needed
- First key saved for any provider is automatically set as active

**Data flow:**

- Settings UI reads `userApiKeys.listHints()` and `users.activeAiProvider` via Convex
  React hooks (real-time, no stale state)
- Mutations go directly to Convex; the key never transits through the Next.js API route

### 2.4 Admin Console — Retire Invite Management

**Remove:**

- Invites panel (generate, track, revoke, batch management)
- `inviteBatchId` cohort analytics in the analytics panel
- Any invite-related event log entries in the UI

**Keep unchanged:**

- User management panel (view users, roles, email, join date, promote/demote admin)
- Feedback dashboard (category, rating, notes, lesson context)
- Analytics panel (AI usage, provider breakdown, lesson engagement, code runs, active users)
- Event log display

---

## Environment Variables Summary

### Track 1 additions (documented, not yet in code)

| Variable                          | Purpose                                              |
| --------------------------------- | ---------------------------------------------------- |
| `NIOTEBOOK_KEY_ENCRYPTION_SECRET` | 32-byte random secret for AES-256-GCM key encryption |

### Track 2 removals (from operational requirements)

| Variable         | Status                                         |
| ---------------- | ---------------------------------------------- |
| `GEMINI_API_KEY` | No longer required; remove from production env |
| `GROQ_API_KEY`   | No longer required; remove from production env |

---

## Content Licensing Notice

CS50 course content (transcripts, titles, chapter data) ingested into Convex is sourced
from Harvard's CS50 courses, licensed under CC BY-NC-SA 4.0 (non-commercial,
share-alike). The Niotebook codebase (MIT) and the course content carry separate licenses.
Self-hosters who ingest CS50 content are responsible for compliance with CC BY-NC-SA —
specifically the non-commercial restriction.

This notice must appear in the README and as a comment in the ingest scripts.

---

## Success Criteria

**Track 1:**

- Repository is public on GitHub
- LICENSE, README, CONTRIBUTING, `.env.example` all present
- Secrets scan returns no live credentials in git history

**Track 2:**

- A new user can sign up without an invite and reach the workspace
- A user can add, edit, switch, and remove API keys for Gemini, OpenAI, and Anthropic
- Nio chat works end-to-end for each of the three providers using the user's own key
- A user with no key configured sees the inline prompt (not a broken chat input)
- Admin console no longer shows an invites panel
- `bun run typecheck && bun run lint && bun run test` all pass
