# PRD Status: ACTIVE

Niotebook v0.2 PRD (Minimal)

Note: Implementation details live in `docs/ADR-001-prd-scope.md` to keep this PRD product‑level.

Problem

- Solo learners need a unified place to watch CS50-derived lessons, code inline, and get strict, narrow-focused, context-aware AI help without latency or jank.

Target User

- Single self-paced learner invited via Clerk email invite (invite-only) and email code sign-in; no classrooms or shared sessions.

Non-Goals

- No classroom/teacher features beyond the admin analytics cockpit; invite management is handled in Clerk for alpha; no shared sessions, transcript UI, offline AI/video, AI file I/O, attachments, or tool execution.

Core Loop

- Onboard with Clerk invite email → email code sign-in → courses route → pick course/lesson → workspace.
- Initial content includes CS50x (2026), CS50P, CS50W, CS50SQL, and CS50 AI delivered as YouTube-embedded lessons; playlist = course, video = lesson, chapters = timestamps.
- Courses route: card grid layout with resume card, Harvard CS50 library section, and greyed-out "Coming Soon" cards (MIT, Stanford, Google, etc.). Note: `CourseCarousel.tsx` was removed during the SiteNav refactor; the carousel approach was replaced by a card grid.
- Course detail page: progress bar, ordered lecture list with completion status, resume button.
- Watch embedded YouTube, code in an IDE-like workspace, and chat with Nio (Prof. David Malan–modeled persona, not named in UI).
- Continuous sync ties video time, code snapshot, and chat thread; resume on any device at last frame.
- Learning Pulse: visible context strip shows what Nio sees (lecture, timestamp, active file); enriched AI context for smarter responses.

UX Principles

- KISS, brutal minimalism; light-first UI with theme toggle in SiteNav (top bar) on courses/landing/auth routes, and in control center on workspace.
- Premium feel: instant or subtly-progressed actions; no jank or blocking modals.
- Chat is continuous per lesson with lesson/timestamp badges and smooth seek on click.
- Chat interaction matches modern ChatGPT-class UX (growing input, enter-to-send with shift+enter newline, autoscroll affordance, no layout shift during streaming).
- Error banners for video/chat are deferred to end-of-phase stabilization.
- Overall UI/UX mirrors ChatGPT web app feel: YouTube + simple code lab embedded inside a clean chat-centric interface.

Engineering Principles

- Functional core with imperative shell: domain logic is pure/deterministic; I/O and integrations are isolated.

Functional Requirements

- Auth: Clerk invite-only + email code; admin allowlist via `NIOTEBOOK_ADMIN_EMAILS`; roles: admin (admin console access), user (workspace), guest (landing + login only). Invite batch tracking uses `inviteBatchId` from Clerk metadata.
- Alpha auth implementation plan: `docs/clerk-auth-alpha.md`.
- Admin console (`/admin`): operational dashboard within the same app, gated by admin role. Features: invite management (generate, track, revoke), user management (roles, activity), feedback dashboard, analytics (KPIs, event logs, AI usage). Analytics use UTC and cohort = inviteBatchId.
- Layout: fixed presets (1-col 100, 2-col 60/40, 3-col 40/30/30); persisted per session.
- Video: YouTube embed; time sampled every 2–5s and on seek/pause; clicking chat badge seeks smoothly.
- Code Editor: CodeMirror 6 with syntax highlight/indent, run, clear output, stop, optional reset-per-lesson.
  - _Tier 2 upgrade:_ Virtual filesystem (VFS), file tree sidebar, tabbed multi-file editing, xterm.js terminal with streaming output, resizable split-pane layout, cross-file imports, lesson-aware environment configs, and enhanced autocomplete. See `docs/code-editor-tier2-plan.md`.
- Execution Packs: JS (sandboxed iframe), Python (Pyodide main-thread), HTML/CSS (sandboxed iframe preview), C placeholder (printf/puts extraction) with Wasmer/TCC planned; uniform executor interface init/run/stop; warm-up via idle prefetch/cache and “Preparing runtimes…” inline status.
  - _Tier 2 addition:_ Wasmer/WASIX sandbox via iframe isolation (`/editor-sandbox` route with COOP/COEP headers) for shell commands; falls back to Pyodide/builtins when unavailable.
- Sync/Resume: Frame = lessonId + videoTimeSec + codeHash? + threadId; persist in Convex; IndexedDB for instant reload cache; chat messages stamped with time window ±60s and codeHash?. Internal-only checkpoints support resume, AI context reconstruction, and deterministic E2E assertions; no checkpoint UI.
- AI: Providers Gemini 3 Flash preview primary, Groq llama-3.3-70b-versatile fallback; strict CS50 TA behavior, context-bound to lesson/time/code; refuses off-topic prompts and redirects to the active lesson; streaming via Next.js route handler; store assistant message on completion. Chat responses rendered as formatted markdown (code blocks with syntax highlighting, inline code, lists, bold/italic).
- Learning Pulse: context strip in chat pane header shows `Lecture N · MM:SS · filename (status)`. Enriched context builder sends file name, language, and last run error to Nio.
- Content Compliance: Each course/lesson shows attribution, license label, source link (compact info strip); treat CS50x content as CC BY-NC-SA (non-commercial).
- Transcripts are AI-only (no transcript UI).
- Viewport Policy: landing, sign-in, sign-up, courses routes available on all viewports (mobile browse-only on courses, no video). Workspace desktop-only (≥1024px). Admin desktop-only.

Out of Scope (v0.2)

- Valkey introduction, rate-limit/cache queues; offline playback; transcript UI; multi-user collaboration.

Risks

- C pack performance might exceed latency budget; mitigation: warm-up status, mark as alpha if slow.
- Pyodide/TCC download size could hurt first load; mitigate with background prefetch and caching.
- Strict AI constraints may frustrate users; mitigate with clear TA tone and on-topic guidance.

Acceptance Criteria

- Language switch after warm-up feels instant; C "hello world" compile+run <500ms on modern laptop; Python/JS warm-up hidden by background prefetch; switching Python→C after warm-up <100ms perceived delay or shows non-blocking warm-up notice.
- Chat shows `Lesson • mm:ss` badge per message; clicking seeks smoothly; streaming text renders as formatted markdown without layout shifts; autoscroll affordance present when scrolled up.
- Resume on another device restores last video bucket, code snapshot per language, and same chat thread.
- Theme toggle available in control center settings; layouts selectable and persisted; light theme default; minimal chrome with sans-first typography and monospace accents.
- Courses route shows carousel with resume card for returning users, CS50 library row, and coming-soon cards. Course detail page shows progress bar and ordered lecture list.
- Sign-in page shows terminal boot sequence animation alongside Clerk card.
- Admin console accessible at /admin for admin role only; all panels (invites, users, feedback, analytics) functional.
- Share and feedback actions in control center are wired to backend (clipboard/Web Share API for share, Convex mutation for feedback).
- Learning Pulse context strip visible in chat pane header, reflecting current lesson, timestamp, and active file.
- Every feature has crisp acceptance criterion, e2e coverage, and dev/test/prod operational story; functional core (domain pure) and imperative shell (I/O) boundary respected.
