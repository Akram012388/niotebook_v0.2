# Preview synopsis

Locked. Below is a **frozen v0.2 spec** (with KISS + FP discipline) that bakes in your latest decisions:

- **C execution:** keep it simple _and_ premium; no “language switch latency” felt.
- **Resume anywhere:** cross-device session persistence is a v0.2 requirement.
- **Chat:** one continuous thread per lesson across sessions, with subtle per-message lesson/timestamp affinity.
- **Checkpoints:** internal only.
- **AI:** always strict (CS50 TA vibe), always course-bounded.
- **UI:** light-theme first, brutal minimalism, theme toggle in control center settings.

---

# Niotebook v0.2 Spec

## 1) Non‑negotiable principles

### 1.1 KISS (but not “toy”)

- Fewer moving parts > more features.
- Every feature must have:
  - a crisp acceptance criterion
  - an e2e test
  - an operational story (dev/test/prod)

### 1.2 Functional core, imperative shell

- **Pure domain layer**: reducers, selectors, validators, context builders.
- **Impure edges**: Convex I/O, YouTube player API, sandboxed runtime/WASM execution, AI calls.

### 1.3 Premium UX budget

- No “jank.”
- Everything important is either:
  - instant, or
  - has a **subtle** progress affordance (never blocking the learner).

---

## 2) Scope boundaries

### In scope (v0.2)

- Single-learner product.
- Clerk invite-only + email code sign-in.
- YouTube embedded MOOC content.
- Unified UI: Video + Code + AI.
- Continuous temporal sync (video ↔ AI thread), code sync on edit.
- In-browser execution for at least: JS + Python + HTML/CSS; C handled via the “KISS premium” plan in §6.
- Cross-device resume.

### Deferred (explicit non-goals)

- Classroom, teacher accounts, shared sessions.
- Transcript UI.
- Offline video playback, offline AI.
- AI file I/O, attachments, or tool execution inside the app.

---

## 3) Content and licensing

- CS50x course materials are licensed under **CC BY‑NC‑SA 4.0**. ([edX][1])
  You must treat this as **non‑commercial content** unless you later secure permission or switch to content licenses that permit commercial usage.

**v0.2 requirement:** every course/lesson must show:

- attribution
- license label
- source link (compact info strip in the video pane)
- transcript ingestion (official CS50 SRT via /x/weeks/ parsing; SRT only; stored in Convex as segment-per-row; AI context only; no transcript UI; no local transcript storage)
- ingestion cadence: deploy-only; preview-data refresh nightly; prod refresh manual/gated

---

## 4) Core UX flows

### 4.1 Onboarding

1. Receive Clerk invite email
2. Sign in with email code (sign-in page with terminal boot sequence animation)
3. Redirect to `/courses` route (Apple TV+/Netflix-style carousel):
   - **Continue Learning** row (returning users): resume card with course, lecture, timestamp, progress
   - **Harvard CS50 Library** row: CS50x 2026, CS50P, CS50AI, CS50W, CS50SQL
   - **Coming Soon** row: greyed-out hardcoded cards (MIT, Stanford, Google, etc.)
4. Click course → course detail page (`/courses/[courseId]`) with progress bar, lecture list, resume button
5. Click lecture → `/workspace?lessonId=X` → start

### 4.2 Learning loop

- Video plays (YouTube embed)
- Code editor is available immediately
- AI chat is always present (per chosen layout mode)
- “Nio” responses are context-bound to:
  - current lesson
  - current time window (±60s)
  - current code (if present)

### 4.3 Resume anywhere

- User can log in on device B and the lesson resumes at:
  - last video time bucket
  - last code state
  - same continuous chat thread

---

## 5) UI/UX spec

### 5.1 Global layout modes (fixed presets only)

- **1‑col:** 100%
- **2‑col:** 60/40
- **3‑col:** 40/30/30

Layouts are user-selectable per session and persisted.

### 5.2 Visual design (Claude-inspired warm palette)

- Light-first palette; dark mode optional. Warm terracotta accent (`--accent: #c15f3c` light / `#da7756` dark).
- Background: `#f4f3ee` (light) / `#1c1917` (dark). See `src/app/globals.css` for full design token system.
- Sans-first typography with monospace accents in code/terminal contexts. Orbitron as display font for wordmark only.
- Minimal chrome, strong spacing discipline, subtle separators.
- ChatGPT web app feel: YouTube + simple code lab embedded in a clean chat‑centric interface.

### 5.3 Required UI micro-interactions

- Theme toggle is available in the control center settings view.
- Chat:
  - ChatGPT-like input behavior (growing textarea, enter-to-send, shift+enter newline)
  - send button as circular icon button
  - autoscroll indicator/button appears when user scrolls up
- streaming text render; no layout shifts
  - video/chat error banners are deferred to end-of-phase stabilization

- Share and feedback actions live in control center settings (inline cards; app-level links only).
- “Context affinity” in chat thread:
  - each message shows a subtle badge on hover: `Lesson • 12:34`
  - clicking badge seeks video to that time (non-jarring, smooth)

### 5.4 Checkpoints

- Internal only; no visible timeline UI.
- Used solely for:
  - resume
  - building AI context safely
  - e2e assertions

### 5.5 Admin console (`/admin`)

- Admin-only route within the same app, gated by admin role check.
- Sidebar nav: Dashboard, Users, Invites, Feedback, Events.
- **Invite management:** Generate codes (single/batch), track status (active/used/expired), revoke active invites.
- **User management:** List users (email, role, joined, last active), change roles, view activity.
- **Feedback dashboard:** List submissions (rating, category, notes, user, timestamp), filter/sort.
- **Analytics dashboard:** KPI cards, event log viewer with filters.
- Filters: time range (UTC), course, lesson, cohort (inviteBatchId).
- KPI cards:
  - invite redemption %
  - onboarding conversion %
  - activation %
  - D1/D7 retention %
  - median active session length
  - lesson completion %
  - AI engagement %
  - share actions
  - feedback rating (median)
  - feedback response rate

- KPI definitions:
- invite redemption = invite_redeemed / invite_issued (custom invite flow only)
- onboarding conversion = lesson_started / auth_email_code_verified
- activation = activated_users / auth_email_code_verified
  - activation criteria = lesson_started + 1 code run + 1 Nio message within 24h
  - D1/D7 retention = active users day 1/7 after activation / activated_users
  - median session length = median time between first/last meaningful action (30m inactivity ends session)
  - lesson completion = lessons_completed / lessons_started; lessons_completed when video ≥80% OR ≥1 successful code run
  - AI engagement = sessions_with_nio_message / sessions
  - share actions = share_copy + share_social
  - feedback rating = median rating from feedback_submitted
  - feedback response rate = feedback_submitted / feedback_opened

- Analytics timezone: UTC.
- Sessionization: client heartbeat every 60s; session ends after 30m inactivity.

---

## 6) Code editor + execution

You want an IDE-like, multi-language experience with **no perceptible latency when switching languages**.

### 6.1 Editor choice

- Prefer **CodeMirror 6** with language packs (lighter than Monaco).
- Editor features (v0.2):
  - syntax highlight + basic indentation
  - run button
  - clear output
  - stop execution
  - optional “reset code” per lesson

### 6.2 Execution architecture (pluggable “Language Packs”)

Define a uniform executor interface:

- `init(): Promise<void>`
- `run({ code, stdin?, timeoutMs }): Promise<{ stdout, stderr, exitCode, runtimeMs }>`
- `stop(): void`

Executors run in isolated contexts:

- JS in a sandboxed iframe
- Python via Pyodide (main thread, streaming output)
- HTML/CSS in sandboxed iframe preview
- C currently uses a lightweight placeholder runner (printf/puts extraction); Wasmer/TCC is the planned upgrade

### 6.3 Latency strategy (how we meet “premium”)

Goal: **language switch feels instant**.

Mechanism:

- On lesson load, immediately initialize the current language executor.
- In the background (idle time), **prefetch and warm** the other executors:
  - use `requestIdleCallback` + progressive fetching
  - cache artifacts via the browser cache/service worker

- UX: a tiny non-blocking “Preparing runtime…” status in the code pane (no modal, no spinner taking over the UI).

### 6.4 Language support plan (v0.2)

**JS**

- Sandbox execution in iframe.
- Capture console.log → stdout.
- External deps resolved via CDN (esm.sh) for `require()`/dynamic `import()`.

**TS (deferred)**

- TypeScript remains deferred and is not exposed in the language selector.

**Python**

- Use Pyodide (lazy load + cache) in the main thread.
- Expect initial download cost; hide it behind background warm-up.

**HTML/CSS**

- Render into sandboxed iframe preview; reload on run.
- Local `script`/`link` assets are resolved from VFS and injected as blob URLs.

**C (your requirement + KISS premium)**
To keep the “no latency” feel, avoid heavyweight clang/LLVM toolchains.

**Pragmatic v0.2 approach:**

Current implementation:

- Extracts `printf`/`puts` string literals and streams output (placeholder runtime).

Planned upgrade:

- Use a **Tiny C Compiler (TCC) in-browser** approach (WASM/emulation), compiled and cached as a language pack.
- This has real prior art: running TCC in a browser via an emulator and executing the produced binary in the same environment. ([GitHub][2])

Acceptance criteria for “C pack”:

- After warm-up, compile+run “hello world” in < 500ms on a modern laptop.
- Switching from Python → C after warm-up: < 100ms perceived delay (no blocking UI).

If C fails the perf bar on real devices:

- keep C editor + highlighting,
- show “C runtime still warming up” (non-blocking) rather than a broken run,
- and treat “C run” as an explicit alpha capability that improves iteratively.

That keeps the product premium even while the C pack matures.

### 6.5 Tier 2 Implementation Status

The code editor has been upgraded from a plain `<textarea>` to a full IDE-like experience. See `docs/code-editor-tier2-plan.md` for the complete architecture, component tree, state management design (Zustand v5 stores), VFS implementation, and execution sandbox details.

Key additions: CodeMirror 6 editor with multi-language support, virtual filesystem with IndexedDB persistence, file tree sidebar, tabbed multi-file editing, xterm.js terminal with streaming output, resizable split-pane layout, lesson-aware environment configs, and Wasmer/WASIX sandbox via iframe isolation.

---

## 7) Sync model (temporal + spatial)

### 7.1 Core primitive: Frame

A `Frame` binds:

- `lessonId`
- `videoTimeSec`
- `codeHash?`
- `threadId`

### 7.2 Continuous sync rules

- Video time is sampled and persisted in buckets (e.g., every 2–5 seconds and on seek/pause).
- AI chat messages always stamped with:
  - `videoTimeSec`
  - `window: [t-60, t+60]`
  - `codeHash?`

- Code persists only if user edited code (debounced).

### 7.3 Persistence for “resume anywhere”

Store canonical state in Convex:

- `userId + lessonId` → last known frame
- latest code snapshot per language
- continuous chat thread per lesson
- transcript segments per lesson stored in Convex (segment-per-row; AI context only; no local storage)

Local-only (IndexedDB) used for:

- last state cache to make reload feel instant
- optimistic UI while Convex syncs

Conflict resolution:

- Convex is the source of truth.
- On reconnect, Convex state overwrites IndexedDB cache.

---

## 8) AI (Nio) — strict TA mode

System prompt is defined in `docs/ADR-005-nio-prompt.md`.

### 8.1 Providers

Primary: Gemini 3 Flash preview (`gemini-3-flash-preview`). ([Google Cloud Documentation][3])
Fallback: Groq `llama-3.3-70b-versatile`. ([GroqCloud][4])

### 8.2 Strict policy behavior

- Nio refuses off-topic prompts and redirects to the lesson.
- Tone target: energetic, structured, Socratic CS TA (CS50-like), without casual chatter.

### 8.3 Context builder (pure function)

Inputs:

- lesson metadata
- current time window
- transcript snippet for current time window (from SRT)
- last code snapshot (or selection)
- last N messages

Output:

- a minimized prompt payload (token-capped)

### 8.4 Streaming

- Next.js Route Handler streams tokens to client.
- Store final assistant message via Convex mutation once complete.
- Chat responses rendered as formatted markdown (code blocks with syntax highlighting, inline code, lists, bold/italic).

### 8.5a Learning Pulse

- Visible context strip in chat pane header: `Lecture N · MM:SS · filename (status)`.
- Context builder enriched with file name, language, and last run error output.
- Nio prompt updated to reference visible context for more natural responses.

### 8.5 Token budget + fallback

- Total budget: 4096 tokens (context + response).
- Response cap: 1024 tokens; remaining budget reserved for context.
- Fallback triggers: 5xx/429 errors or timeout ≥10s.
- Log fallback events to analytics for visibility.

---

## 9) Auth (Clerk invite-only + email code)

### 9.1 Auth system

- Clerk invite-only auth with email code.
- Convex uses Clerk identity (`ctx.auth.getUserIdentity()`).
- Admin access controlled by `NIOTEBOOK_ADMIN_EMAILS` allowlist.
- `inviteBatchId` is stored as Clerk invitation metadata for cohort tracking.
- Implementation plan: `docs/clerk-auth-alpha.md`.

### 9.2 Email template requirement

- Use Clerk email templates for invite + code delivery.
- Requirements:
  - clear CTA or code display
  - device/time note
  - minimal but warm copy

---

## 10) PWA/offline (minimal)

- Installable.
- Cache shell assets.
- Cache last session state locally.
- No offline AI, no offline video.

---

# 11) Dev/Test/Prod and CI/CD (Vercel + Convex + Bun)

## 11.1 Environments

- **Dev**: local Next + local Convex dev deployment
- **Preview**: Vercel Preview URL + Convex preview backend
- **Prod**: Vercel Production + Convex prod backend

## 11.2 Vercel ↔ Convex alignment

Convex supports per-preview deployments, but v0.2 uses a **long-lived preview-data** backend to keep seeded data stable. ([Convex Developer Hub][5])

For Vercel Build Command:

- Use `bun run build` only. Convex deploy + ingest run in GitHub Actions.

## 11.3 E2E after preview deploy

Use Vercel’s recommended `repository_dispatch` flow on successful deployments (`vercel.deployment.success`). ([Vercel][6])

Playwright runs only when the preview is e2e-ready (the app emits the
`niotebook-e2e` marker when `NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW=true`) and the
deployment ref is `main`.

This guarantees Playwright runs against the real deployed URL (not localhost).

## 11.4 Security scanning and monitoring

- **Sentry**: runtime errors + performance traces (client + server)
- **Semgrep**: run in CI on PRs (rule set tuned later)

(Keep pre-commit hooks minimal: lint/typecheck only; don’t block commits with heavy scans.)

---

# 12) Valkey (cache/queue) recommendation

Valkey is a Linux Foundation–backed open-source key/value datastore used for caching and message-queue workloads. ([linuxfoundation.org][7])

**v0.2 decision:** do **not** add Valkey yet.

- Convex already provides DB + realtime + scheduling, which is sufficient for alpha.
- Adding Valkey now increases infra complexity without proven need.

**When to introduce later:**

- rate limiting becomes non-trivial,
- AI response caching is required to control spend,
- background job throughput exceeds what Convex scheduling comfortably handles.

---

# 13) Repo structure (Next + Convex + FP)

Suggested layout:

- `src/domain/`
  Pure types + reducers + validators + context builder (no imports from Convex/Next).
- `src/infra/`
  Convex client wrappers, YouTube API adapter, AI HTTP client, storage adapters.
- `src/ui/`
  Components, layouts, theme system.
- `src/app/`
  Next App Router routes.
- `convex/`
  schema + functions/mutations/queries.
- `tests/e2e/`
  Playwright specs.
- `docs/`
  spec + ADRs.

---

# 14) Final “lock” pointers (only 3)

Infer these and the spec becomes implementation-ready:

1. **First few courses to ship in alpha:** CS50x (latest 2026), CS50P, CS50W, CS50AI, CS50SQL.
2. **Lesson granularity:** playlist = course, video = lesson, chapters = timestamped segments.
3. **Invite admin UX:** admin console at `/admin` with invite management (generate, track, revoke), user management, feedback dashboard, and analytics. Roles remain: admin (admin console access), user (workspace + courses), guest (landing + auth only).

With these pointers also produce directives for:

- the exact `package.json` scripts (bun-first),
- the GitHub Actions workflows (PR checks + Playwright on `vercel.deployment.success`),
- and the Convex schema + minimal function set that matches the domain model:
  - queries: getCourses, getLessonsByCourse, getLesson, getTranscriptWindow, getChatThread, getChatMessages, getLatestFrame, getCodeSnapshot
  - mutations: upsertInvite, redeemInvite, upsertFrame, upsertCodeSnapshot, createChatMessage, setLessonCompleted, logEvent
  - actions: ingestCourse, ingestTranscripts

# References

[1]: https://cs50.harvard.edu/x/license/?utm_source=chatgpt.com "License"
[2]: https://github.com/pixeltris/webc86?utm_source=chatgpt.com "pixeltris/webc86: Compile / run C in a web browser via ..."
[3]: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/3-flash?utm_source=chatgpt.com "Gemini 3 Flash | Generative AI on Vertex AI"
[4]: https://console.groq.com/docs/model/llama-3.3-70b-versatile?utm_source=chatgpt.com "Llama-3.3-70B-Versatile - GroqDocs"
[5]: https://docs.convex.dev/production/hosting/vercel?utm_source=chatgpt.com "Using Convex with Vercel | Convex Developer Hub"
[6]: https://vercel.com/kb/guide/how-can-i-run-end-to-end-tests-after-my-vercel-preview-deployment?utm_source=chatgpt.com "How can I run end-to-end tests after my Vercel Preview ..."
[7]: https://www.linuxfoundation.org/press/linux-foundation-launches-open-source-valkey-community?utm_source=chatgpt.com "Linux Foundation Launches Open Source Valkey Community"
