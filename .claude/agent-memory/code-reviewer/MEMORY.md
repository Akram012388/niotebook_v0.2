# Code Reviewer Memory -- Niotebook Project

## Architecture & Conventions

- **Theme system**: `data-theme` attribute on `<html>`. Custom Tailwind variant: `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))`. CSS custom properties in `:root` and `[data-theme="dark"]`.
- **ForceTheme**: Still used by workspace (light) and legal pages (dark). Removed from signin/courses in Phase 8.
- **storageAdapter**: SSR-safe localStorage wrapper at `src/infra/storageAdapter.ts`. Used by ThemeToggle + 4 workspace components.
- **Hydration pattern**: Components using localStorage read it inside `requestAnimationFrame` in `useEffect`, render skeleton/default on SSR, then correct after mount. (ThemeToggle uses this pattern.)
- **SiteNav**: Shared top nav at `src/ui/shared/SiteNav.tsx`. 3-prop API: children, wordmarkHref, ariaLabel. Used by LandingNav, AuthShell, CoursesLayout.
- **Path aliases**: `@/*` -> `./src/*`. Re-export shims at `src/ui/landing/{ThemeToggle,NotebookFrame}.tsx` have been deleted. Canonical locations: `src/ui/shared/`.
- **Convex queries**: Function references created via `makeFunctionReference` with type casts. Used with `useQuery`/`useMutation`.
- **Animation lib**: Framer Motion used across course/auth pages. Stagger patterns with `variants` + `whileInView`.
- **Clerk overrides**: CSS in `globals.css` using `!important` on `.cl-*` selectors.

## Chat Stream Architecture (reviewed 2026-02-07, POST-OVERHAUL)

See `chat-stream-review.md` for client-side findings. See `chat-backend-review.md` for server-side/route handler findings. Typewriter/RevealContent system was REMOVED in commit 72a08f1.

### Current key patterns

- **Rendering**: `isStreaming` true -> plain `<span>` text; false -> `<ReactMarkdown>`. No typewriter.
- **Token batching**: `tokenBuffer` + RAF-scheduled `flushTokens()` prevents per-token state updates.
- **Three-layer dedup**: remote (Convex) > cached (localStorage) > local (React state) in `mergedMessages`
- **Provider fallback**: Gemini primary -> first-token timeout -> Groq fallback (server-side)
- **Auto-scroll**: ResizeObserver on content wrapper + atBottom ref guard in ChatScroll
- **Stuck stream guard**: 30s `STUCK_STREAM_TIMEOUT_MS` allows force-sending new message

### Open issues (from 2026-02-07 reviews)

- **CRITICAL: No AbortController on client fetch** -- streams leak on lesson change/unmount
- **CRITICAL: Gemini API key in debug logs** (`geminiStream.ts:103-104`, requestUrl includes `?key=`)
- **CRITICAL: Regex /g flag bug** in `promptInjection.ts:6-17` -- `.test()` with module-level `/gi` patterns causes alternating detection failures
- **CRITICAL: Provider iterators never cancelled on fallback/abort** -- Gemini HTTP connections leak for up to 60s when Groq fallback is triggered
- **WARNING: No server-side input size limits** -- `validateNioChatRequest.ts` checks types but not lengths; DoS via large payloads
- **WARNING: SSRF via subtitlesUrl** -- `subtitleFallback.ts:97` fetches any URL from DB without host validation
- **WARNING: subtitleCache/ytCache grow unbounded** -- module-level Maps with no max-size eviction
- **WARNING: Auth bypassed in dev/preview** -- `isConvexAuthRequired()` returns false, rate limit errors silently swallowed -> no auth AND no rate limiting
- **WARNING: Fire-and-forget persistence** -- `persistAssistantMessage` has no retry, messages lost on Convex errors
- `mergedMessages` new object refs defeat React.memo on every token flush
- `wasStreaming` and `isRevealing` fields fully removed from codebase (old typewriter system deleted)
- `ChatStreamState` "error" variant defined but never set
- No unit tests for `neutralizePromptInjection`
- `ReadableStream.cancel()` callback is a no-op (should propagate abort)

## Niotepad Panel (reviewed 2026-02-08, updated 2026-02-09 for PR #98)

### Key patterns

- **Drag system**: FM `drag="x"` with object-based constraints (not ref-based). Constraints are RELATIVE to CSS `left`.
- **Position persistence**: `mountPosition` via `useState` lazy initializer. `handleDragEnd` persists `getBoundingClientRect().left`. Remounts on each open/close.
- **Constraint math**: `left: VIEWPORT_PADDING - mountPosition.x`, `right: vw - PANEL_WIDTH - VIEWPORT_PADDING - mountPosition.x`.
- **Elasticity**: `dragElastic={0.04}`, `dragMomentum={false}`.
- **Portal structure**: `NiotepadPortal` > Fragment > `NiotepadPanel` (single `<motion.aside>`).
- **Focus trap**: Tab wrapping + ESC 3-tier cascade (editing > search > close).
- **Minor**: resize listener fires on vertical resize too (harmless, constraints width-only).

### PR #98 findings (2026-02-09)

- **CRITICAL: Gmail API routes have NO authentication** -- any HTTP client can send emails, read messages, trash mail
- **WARNING: Gmail tokens stored in filesystem** (.gmail-tokens.json) -- unsafe for Vercel serverless (ephemeral FS)
- **WARNING: NiotepadBackdrop and NiotepadResizeHandle are dead code** -- exported but never imported
- **WARNING: ytCache unbounded Map** (pre-existing from subtitleFallback, also in new youtubeTranscriptFallback.ts)
- **WARNING: Bookmark handler button pattern duplicated 3x** (AiPane, CodePane, VideoPane) -- should be extracted
- Good: domain types are pure, no `any`/`unknown` violations, proper useEffect cleanup, memo usage

## Review Findings (Phase 8, 2026-02-07)

- See `phase8-review.md` for detailed findings
- Key patterns: ThemeToggle radiogroup has good ARIA
- OTP CSS fix correctly moved from hardcoded hex to CSS custom properties
- `dark:` prefix removal was clean -- 0 remaining in all 4 course component files
- SVGs in CourseDetailPage lecture cards missing `aria-hidden` on decorative checkmarks
- Lecture card animations: each card has `delay: i * 0.1` which could be slow for 20+ lectures
