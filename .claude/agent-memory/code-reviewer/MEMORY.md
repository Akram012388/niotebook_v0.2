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

## Chat Stream Architecture (reviewed 2026-02-07)

See `chat-stream-review.md` for detailed findings.

### Key patterns
- **State machine**: `isStreaming` -> `isRevealing` (at 200-char threshold) -> `wasStreaming` (done event) -> `revealed` (typewriter complete) -> markdown render
- **RevealContent**: Uses cursor-ref pattern (`cursorRef`, `contentLenRef`) to avoid RAF reset on re-render. `[]`-dep effect with ref reads.
- **onDoneRef pattern**: Callback stored in ref, synced via effect. Allows `[]`-dep RAF loop to call latest callback.
- **Token batching**: `tokenBuffer` + RAF-scheduled `flushTokens()` prevents per-token React state updates.
- **Auto-scroll**: `ResizeObserver` on content wrapper, disabled during streaming via early return.
- **onSeek**: Passed from WorkspaceGrid (`useCallback`-wrapped) through AiPane to ChatMessage. Stable reference.

### Known issues
- `contentVisibility: "auto"` applied when `isActive` is false, but typewriter may still be running internally
- `mergedMessages` creates new object refs for ALL messages on each recompute, reducing React.memo effectiveness
- Error events intentionally skip `wasStreaming: true` -- errors render immediately as markdown
- Short responses (<200 chars) show thinking dot until done event, no incremental feedback

## Review Findings (Phase 8, 2026-02-07)

- See `phase8-review.md` for detailed findings
- Key patterns: ThemeToggle radiogroup has good ARIA
- OTP CSS fix correctly moved from hardcoded hex to CSS custom properties
- `dark:` prefix removal was clean -- 0 remaining in all 4 course component files
- SVGs in CourseDetailPage lecture cards missing `aria-hidden` on decorative checkmarks
- Lecture card animations: each card has `delay: i * 0.1` which could be slow for 20+ lectures
