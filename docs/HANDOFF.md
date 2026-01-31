# Session Handoff — Phase 1 → Phase 2

This file captures context for the next Claude Code session to pick up where Phase 1 left off.

## What Was Completed (Phase 1)

**Branch:** `fix/core-polish` (merged to `main` via PR)

### A6: Fix Known UI Issues
- Fixed typo "experinced" → "experienced" in `src/ui/layout/WorkspaceShell.tsx:14`
- Wired User panel in `src/ui/shell/ControlCenterDrawer.tsx` — shows email, role, invite batch, sign-out button
- Added `me` query to `convex/users.ts` (returns current user's role + inviteBatchId)
- Added `meRef` function reference in `src/ui/auth/convexAuth.ts`
- Connected via Clerk's `useUser`/`useClerk` in `src/ui/shell/TopNav.tsx`

### A1: AI Chat Streaming + Markdown Rendering
- Installed `react-markdown@10`, `remark-gfm@4`, `rehype-highlight@7`
- Updated `src/ui/chat/ChatMessage.tsx` — assistant messages render as markdown (code blocks with syntax highlighting, tables, lists, blockquotes)
- Added `highlight.js/styles/github-dark-dimmed.css` import in `src/app/globals.css`
- Added `.nio-markdown` CSS styles for all markdown elements
- Wrapped assistant content in `React.memo` to prevent re-renders during streaming

### A2: Terminal Runtime Correctness
- Verified all executors work: JS (iframe sandbox), Python (Pyodide), HTML (iframe), CSS (no-op)
- C executor is static analysis only (regex-extracts printf/puts) — documented limitation, real compilation deferred to Wasmer Phase 4
- Added 6 tests: `tests/unit/infra/runtime/cExecutor.test.ts`
- Added 4 tests: `tests/unit/infra/runtime/imports/cIncludes.test.ts`
- All 126 tests pass, typecheck clean, lint clean

## Infrastructure Already Set Up

### Claude Code Config (`.claude/`)
- **Permissions:** `Bash(*)`, `Read(*)`, `Write(*)` in `.claude/settings.local.json`
- **Hooks:** Auto-typecheck on `.ts`/`.tsx` edits (PostToolUse hook)
- **Slash commands:** `/verify`, `/merge-check`, `/deploy-preview`, `/ws-status` in `.claude/commands/`

### MCP Servers
- **Convex MCP** — connected (`.mcp.json`)
- **Playwright MCP** — connected (`.mcp.json`)
- **GitHub MCP** — not needed, `gh` CLI is authenticated and sufficient

### GitHub Issues (20 total, #31–#50)
Labels: `ws-a`, `ws-b`, `ws-c`, `ws-d`, `ws-e`, `phase-1`–`phase-4`

| # | Title | Labels | Status |
|---|-------|--------|--------|
| 31 | A1: AI Chat Streaming + Markdown Rendering | ws-a, phase-1 | Close after merge |
| 32 | A2: Terminal Runtime Correctness | ws-a, phase-1 | Close after merge |
| 33 | A3: Learning Pulse: Context Strip + Smarter Nio | ws-a, phase-2 | Open |
| 34 | A4: Share & Feedback Wiring | ws-a, phase-2 | Open |
| 35 | A5: Sign-In Page Terminal Aesthetic | ws-a, phase-2 | Open |
| 36 | A6: Fix Known UI Issues | ws-a, phase-1 | Close after merge |
| 37 | B1: Courses Route (/courses) | ws-b, phase-2 | Open |
| 38 | B2: Course Detail Page | ws-b, phase-2 | Open |
| 39 | B3: Course Card Component | ws-b, phase-2 | Open |
| 40 | B4: Update User Journey Routing | ws-b, phase-3 | Open |
| 41 | B5: Resume Experience | ws-b, phase-2 | Open |
| 42 | C1: Admin Route & Layout | ws-c, phase-2 | Open |
| 43 | C2: Invite Management | ws-c, phase-2 | Open |
| 44 | C3: User Management | ws-c, phase-2 | Open |
| 45 | C4: Feedback Dashboard | ws-c, phase-2 | Open |
| 46 | C5: Analytics Dashboard | ws-c, phase-2 | Open |
| 47 | D1: Ingest CS50 Course Library | ws-d, phase-3 | Open |
| 48 | D2: Progress Tracking UI | ws-d, phase-3 | Open |
| 49 | D3: Hardcoded Coming Soon Cards | ws-d, phase-3 | Open |
| 50 | E1: E2E Test Suite | ws-e, phase-4 | Open |

## What Comes Next (Phase 2)

**Reference:** `docs/plan.md` — full workstream details

### Setup Steps for Phase 2
1. Close issues #31, #32, #36 (Phase 1 items)
2. Create 3 git worktrees from `main`:
   ```bash
   git worktree add ../niotebook-ws-a fix/core-polish-phase2   # A3, A4, A5
   git worktree add ../niotebook-ws-b feat/courses-route        # B1–B5
   git worktree add ../niotebook-ws-c feat/admin-console         # C1–C5
   ```
3. Run `bun install` in each worktree
4. Write per-worktree CLAUDE.md files (templates in `docs/plan.md` → Step 7)
5. Launch tmux 4-pane layout (orchestrator + 3 workers)
6. Write orchestrator CLAUDE.md for main repo

### Parallel Workstreams
- **WS-A** (A3, A4, A5): Polish — context strip, share/feedback, sign-in terminal
- **WS-B** (B1–B5): Courses route — entirely new files, no overlap
- **WS-C** (C1–C5): Admin console — entirely new files, no overlap

### Merge Order (Phase 3)
A → B → C → D1/D2/D3 → B4 (routing update)

## Key Files Modified in Phase 1

| File | Change |
|------|--------|
| `convex/users.ts` | Added `me` query |
| `src/ui/auth/convexAuth.ts` | Added `meRef` |
| `src/ui/chat/ChatMessage.tsx` | Markdown rendering for assistant messages |
| `src/app/globals.css` | highlight.js import + `.nio-markdown` styles |
| `src/ui/layout/WorkspaceShell.tsx` | Typo fix |
| `src/ui/shell/ControlCenterDrawer.tsx` | User panel with email/role/signout |
| `src/ui/shell/TopNav.tsx` | Clerk user data + `meRef` query |
| `package.json` | react-markdown, remark-gfm, rehype-highlight |

## Verification Commands
```bash
bun run typecheck   # TypeScript strict
bun run lint        # ESLint + Prettier
bun run test        # 126 unit tests
```
