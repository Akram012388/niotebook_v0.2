# Frontend Designer Agent Memory

## Design System

### Font Stack

- **Orbitron** (display/logo): loaded in `layout.tsx` as `--font-orbitron`, weights 400-700
- **Geist Sans** (body): `--font-geist-sans` / `--font-body`
- **Geist Mono** (code): `--font-geist-mono` / `--font-code`
- Token chain: `layout.tsx` sets CSS var -> `globals.css` `:root` aliases -> `@theme inline` maps to Tailwind utilities

### Color Tokens

- Accent: Crail terracotta `#C15F3C` (light) / `#DA7756` (dark)
- Background: Pampas `#F4F3EE` (light) / `#1C1917` (dark)
- Surface-muted: `#EDEAE4` (light) / `#2E2A27` (dark)
- Border-muted: `#EDEAE4` (light) / `#2E2A27` (dark) — good hover target for surface-muted buttons
- Theme: `data-theme` attribute on `<html>`, not class-based

### Nav Button Pattern (unified post-SiteNav refactor)

- Standard class: `rounded-lg bg-surface-muted px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-border-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-4 sm:py-2`
- Used in: LandingNav (Link), AuthShell (Link), CoursesNavActions (button)
- No extracted component — kept inline, 3 consumers only

### SiteNav Component

- Location: `src/ui/shared/SiteNav.tsx`
- Fixed nav, `h-[72px]`, `z-50`, backdrop-blur
- Background: `color-mix(in srgb, var(--background) 80%, transparent)` (inline style — no Tailwind equiv)
- Border: `1px solid var(--border)` (inline style)
- Children gap: `gap-2 sm:gap-3` (tighter on mobile)
- Content offset: consumers use `pt-[72px]` on main content

### Brand Component: Wordmark

- Location: `src/ui/brand/Wordmark.tsx`
- Used in: SiteNav (h=40), legal pages (h=24)
- 'i' in accent color, 1.05x size for dot emphasis
- Font-size ratio: 0.85 \* height, weight: 700

### NotebookFrame Component

- Location: `src/ui/shared/NotebookFrame.tsx`
- Reusable wrapper — landing, auth, course pages
- `compact` prop for tighter padding; `hidden sm:block` pattern for mobile

### TopNav Circle Button Pattern (workspace header)

- Location: `src/ui/shell/TopNav.tsx`
- Standard circle class: `rounded-full border border-border bg-surface-muted p-2 text-text-muted transition hover:bg-surface hover:text-foreground`
- Icon size: `size={16} weight="regular"` (Phosphor icons)
- Computed size: 16px icon + 8px*2 padding = 32px (h-8)
- NiotepadPill uses `h-8 w-8` instead of `p-2` (letter "N" not an icon, needs explicit dims)
- Buttons (L to R): Share, Feedback, NiotepadPill, LayoutPresetToggle, ControlCenter
- Share/Feedback are shortcuts that open ControlCenterDrawer to settings > share/feedback card
- ControlCenterDrawer accepts `initialSettingsCard?: SettingsRoute | null` prop

## Auth Pages Pattern

- **Top bar**: SiteNav with ThemeToggle + "← Home" link
- **Content area**: `max-w-4xl`, `pt-24 pb-12`
- **Desktop (sm+)**: Content wrapped in NotebookFrame
- **Mobile**: Content rendered bare

## Landing Page Structure

- `page.tsx` -> LandingNav, HeroSection, ValuePropSection, FeaturesSection, CTASection, LandingFooter
- All sections use `relative z-[2]`, consistent `max-w-4xl`, `py-12 sm:py-16`, `px-4 sm:px-6`

## Course Pages Pattern

- CoursesPage and CourseDetailPage wrap content in desktop-only NotebookFrame (`compact`)
- Loading skeletons: `nio-shimmer` class (not `animate-pulse`)

## Niotepad Panel Architecture (Phases 2-8 complete — 2026-02-08)

- **Portal mount**: `createPortal(document.body)` — outside React tree, no overflow clipping
- **Lazy loading**: `next/dynamic` with `ssr: false` for NiotepadPortal
- **Z-index**: Backdrop z-49, Panel z-50 (same as ControlCenterDrawer — mutual exclusion prevents overlap)
- **Animation**: Framer Motion spring — open: scale:0.92→1, y:12→0, stiffness:400, damping:28, mass:0.8
- **Drag**: `useDragControls` — only drag handle initiates drag, not the whole panel
- **Resize**: Pointer capture on resize handle, delta-based with min/max constraints
- **Panel shadow**: 5-layer warm-tinted shadow (rgba warm browns), harmonizes with parchment
- **Mutual exclusion**: Opening drawer calls `useNiotepadStore.getState().closePanel()`. Opening niotepad uses `useNiotepadStore.subscribe()` to close drawer.
- **CSS tokens** (warm parchment palette, NOT reusing workspace --surface):
  - Panel: `--niotepad-panel-bg` (#f7f0e4 / #272119), `--niotepad-panel-border` (#e0d5c4 / #3d3429)
  - Paper: `--niotepad-paper` (#faf5eb / #2a2420), `--niotepad-ruled`, `--niotepad-margin`
  - Header: `--niotepad-header-bg` (#f2eadb / #2e271f), `--niotepad-header-border`
  - UI: `--niotepad-surface-muted`, `--niotepad-text-muted`, `--niotepad-text-subtle`
  - Scrollbar: `--niotepad-scrollbar`, `--niotepad-scrollbar-hover`
  - All tokens have dedicated light + dark values; inline `style={}` since not in `@theme inline`
- **Ruled paper**: `repeating-linear-gradient` at 24px + margin line at 47px, `background-attachment: local`
- **Binder**: BINDER_LEFT=12 (tighter than NotebookFrame's 20px), custom scrollbar `.niotepad-scroll`
- **Entries**: CONTENT_PL=56, line-height:24px, ReactMarkdown `.nio-markdown`, memo'd by id+updatedAt+isEditing
- **Swipe-to-delete**: drag="x", 80px threshold, `useMotionValue` + `useTransform` for strip opacity, height collapse
- **Page nav**: tabs "All" + sorted lecture tabs, accent underline, ArrowLeft/Right keyboard, hidden when ≤1 page
- **Search**: collapsible magnifier -> input + filter chips (Code/Chat/Video/Notes), `aria-live` result count
- **A11y**: `useReducedMotion()`, focus trap, scoped ESC, ARIA roles on all interactive elements

## Lessons Learned

### Inline Styles vs Tailwind Utilities (2026-02-07)

- **Problem**: `style={{ background: "var(--surface-muted)" }}` bypasses Tailwind's utility system
- **Fix**: Use `bg-surface-muted` when `--color-surface-muted` is mapped in `@theme inline`
- **Rule**: Only use inline styles when CSS custom properties aren't mapped to Tailwind tokens (e.g., `color-mix()`)

### Focus-Visible Rings for Keyboard Navigation (2026-02-07)

- Use `focus-visible` not `focus` — avoids ring on mouse clicks
- Pattern: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background`

### Nav Height Contract (2026-02-07)

- SiteNav is exactly `h-[72px]` — contract with content areas using `pt-[72px]`
- Made explicit (was implicit via py-4 + content height)

### Grid Pattern z-index Stacking (2026-02-06)

- `.nio-pattern::before` is `position: fixed; z-index: 1`
- All content sections need `relative z-[2]`

### Tailwind 4 @theme inline Circular References (2026-02-06)

- Never do `--font-display: var(--font-display)` — point to source var

### Dark Surface Text Contrast (2026-02-06)

- On `bg-surface-strong`, use `text-surface-strong-foreground/{opacity}` not `text-text-muted`

### Clerk OTP Theme Fix (2026-02-07)

- Use CSS custom properties in `.cl-otpCodeFieldInput`, not hardcoded hex

### Git Race Conditions with Team Agents (2026-02-07)

- Write files -> `git add` immediately -> commit ASAP
- Verify branch before each git operation

### React Compiler Lint: No Ref Writes During Render (2026-02-07)

- `react-hooks/refs` rule forbids `someRef.current = value` in the render body
- Move ref writes into `useEffect`: `useEffect(() => { ref.current = value }, [value])`
- For RAF loops reading latest prop values: use `useEffect` to sync prop -> ref, RAF reads ref
- Effect order: React runs effects after render, RAF runs before next paint -- timing is fine
- **Tooltip positioning with refs**: Cannot call `containerRef.current?.getBoundingClientRect()` during render.
  Pattern: use `useState<HTMLElement | null>` as callback ref (`ref={setElement}`), sync to ref via `useEffect`,
  compute position from state element (not ref) in render body. Pass pre-computed coords to child components.

### react-hooks/set-state-in-effect Lint Rule (2026-02-08)

- Calling `setState` directly inside `useEffect` body triggers lint error
- For Zustand mutual exclusion: use `store.subscribe()` inside useEffect — subscribe callback runs outside effect body
- For syncing state from props: prefer memo comparison + key-based remount (e.g., memo'd by `entry.updatedAt`)
- For prop-driven state transitions: use `window.requestAnimationFrame(() => setState(...))` inside effect — rAF callback runs outside effect body, passes lint

### Framer Motion Swipe-to-Delete Pattern (2026-02-08)

- `useMotionValue(0)` + `useTransform(dragX, [-threshold, 0], [1, 0])` for reactive opacity
- Vertical scroll tolerance: track `dragDirectionRef` — if dy > dx, set to "vertical" and force `dragX.set(0)`
- Delete animation via `isDeleting` state + `onAnimationComplete` triggers actual `onDelete(id)`
- **CRITICAL**: Add `select-none` to draggable div — `cursor-text` on content div causes browser text selection to intercept pointer events, breaking FM drag
- **CRITICAL**: Add `touchAction: "pan-y"` in style — lets browser handle vertical scroll while FM handles horizontal drag
- `dragPropagation={false}` (default) acquires global lock, preventing parent motion elements from starting same-axis drag

### Framer Motion Drag with useDragControls (2026-02-08)

- Set `drag` + `dragListener={false}` + `dragControls={dragControls}` on motion element
- Handle starts drag via `dragControls.start(e)` in onPointerDown
- `dragMomentum={false}` prevents fling behavior
- Persist position on `onDragEnd` via `getBoundingClientRect()`

### Framer Motion dragConstraints as Object (2026-02-08)

- Object `{ left, right }` values are RELATIVE OFFSETS from the element's CSS position, NOT absolute coordinates
- For a panel at `left: X`: `left: PADDING - X` (negative = can move left), `right: (vw - WIDTH - PADDING) - X`
- Use `document.documentElement.clientWidth` not `window.innerWidth` — clientWidth excludes scrollbar
- Clamp persisted position to viewport bounds on open: `Math.max(PAD, Math.min(stored, maxX))`

### AnimatePresence initial={false} for HMR Resilience (2026-02-08)

- Dynamic-imported portals (`next/dynamic` + `ssr: false`) remount on HMR
- If Zustand `isOpen` is already `true` when portal re-mounts, FM starts from `initial={{ opacity: 0 }}`
- FM `AnimatePresence initial={false}` skips entrance animation when children are present on first render
- Pattern: `const [mountedWhileOpen] = useState(() => isOpen)` captures mount-time value without ref access
- Pass `<AnimatePresence initial={!mountedWhileOpen}>` — skips anim on HMR, runs normally on user toggle

### Framer Motion v12 isElementKeyboardAccessible (2026-02-08)

- FM v12 blocks drag when pointerdown target is: BUTTON, INPUT, SELECT, TEXTAREA, A, or contentEditable
- `role="button"` with `tabIndex=0` on a DIV does NOT block drag (only tag-based check)
- But BUTTON elements inside draggable area DO block drag — expected behavior for interactive children

### RevealContent Typewriter Pattern (2026-02-07)

- RAF loops that depend on growing content must NOT use content length in `useEffect` deps
- Store cursor in `useRef`, content length in `useRef`, run RAF loop once on mount (`[]` deps)
- The loop reads `contentLenRef.current` each tick -- always sees latest value
- Guard with `Math.min(cursor, target)` in case content ever shrinks

### Niotepad Bookmark Content Rules (2026-02-08)

- Video bookmarks: NiotepadEntry already renders terracotta header from `metadata.lectureTitle` — don't duplicate in `content`
- Code bookmarks: insert as plain text, not markdown code blocks (triple backticks render with dark `pre` background from `.nio-markdown pre`)
- Niotepad `pre` override in globals.css: must set `background: transparent; color: inherit;` to prevent dark bg leak
- Entry spacing: `mb-3` on `motion.article` for visual breathing room between entries
- Unused CSS tokens removed: `--niotepad-code-accent`, `--niotepad-chat-accent` (border-left indicators removed)

## Admin Console Pattern (redesigned 2026-02-07)

- **Layout**: Sidebar (w-60) + main content (max-w-[1200px] mx-auto)
- **Sidebar**: Wordmark (h=24) + "Admin" pill badge, nav items with icons, ThemeToggle at bottom, "Back to app" link
- **Active nav**: `bg-accent text-white font-medium shadow-sm` on `rounded-xl`
- **Inactive nav**: `text-text-muted hover:bg-surface-muted hover:text-foreground`
- **Cards**: `rounded-2xl border border-border bg-surface p-5` + `hover:border-accent/20 hover:shadow-md transition-all duration-200`
- **Section labels**: `text-xs font-semibold font-mono uppercase tracking-[0.15em] text-accent`
- **Toggle groups**: `rounded-xl border border-border bg-surface p-1` container, `rounded-lg` buttons with `bg-accent text-white` active
- **Input pattern**: `rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-text-subtle transition-colors duration-150 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20`
- **Table containers**: `rounded-2xl border border-border` outer
- **Table headers**: `bg-surface-muted` with `py-3 text-xs font-medium text-text-muted`
- **Table rows**: `hover:bg-surface-muted/50 transition-colors duration-100`
- **Event badges**: `rounded-md bg-accent-muted px-2 py-0.5 font-mono text-accent` (not plain bg-surface-muted)
- **Status badges**: `rounded-full px-2.5 py-0.5 text-xs font-medium` with status color bg/text
- **Generate button**: `rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-accent-hover`
- **Loading state**: spinner `animate-spin border-2 border-border border-t-accent` + text
- **Access denied**: lock icon in `bg-accent-muted` container + text

## Figma Brand Plugin (tools/figma-brand-plugin/)

- See `tools/figma-brand-plugin/` for full code; `bun run build` (esbuild)
- Key: `buildWordmarkText()`, 'i' char index 1, terracotta accent, `documentAccess: "dynamic-page"`

## File Locations

- Globals CSS: `src/app/globals.css` (tokens, theme, patterns)
- Layout: `src/app/layout.tsx` (font loading, body classes)
- Brand: `src/ui/brand/Wordmark.tsx`
- Shell: `src/ui/shell/AppShell.tsx`
- Shared: `src/ui/shared/SiteNav.tsx`, `ThemeToggle.tsx`, `NotebookFrame.tsx`
- Landing: `src/ui/landing/` (Hero, ValueProp, Features, CTA, LandingFooter, LandingNav)
- Auth: `src/ui/auth/AuthShell.tsx`, `BootSequence.tsx`
- Courses: `src/ui/courses/CoursesNavActions.tsx`, `CoursesPage.tsx`, `CourseDetailPage.tsx`
- Niotepad: `src/ui/niotepad/` (Provider, Portal, Panel, DragHandle, Pill, ScrollArea, Entry, Composer, PageNav, Search)
- Legal stubs: `src/app/(landing)/terms|privacy|cookies/page.tsx`
- ForceTheme: `src/ui/ForceTheme.tsx`
- StorageAdapter: `src/infra/storageAdapter.ts`
