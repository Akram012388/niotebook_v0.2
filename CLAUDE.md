# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev          # Next.js dev server (Turbopack)
bun run dev:convex   # Convex backend dev server
bun run build        # Production build
bun run lint         # ESLint 9
bun run typecheck    # TypeScript strict check
bun run format       # Prettier format
bun run format:check # Prettier check only
bun run test         # Unit tests (Vitest)
bun run test:e2e     # E2E tests (Playwright)
bun run check:any    # Forbids `any` in convex/ and tests/
bun run check:unknown # Forbids `unknown` in src/domain
```

Run a single unit test: `bunx vitest run path/to/test.ts`
Run a single E2E test: `bunx playwright test path/to/test.ts`

## Architecture

**Stack:** Next.js 16 (App Router, React 19) · TypeScript strict · Tailwind CSS 4 · Convex (serverless backend) · Clerk (auth) · Bun

**Path alias:** `@/*` → `./src/*`

### Source Layout

- **`src/app/`** — Next.js routes. `(landing)/` is the public landing + info pages. `workspace/` is the main protected route. `courses/` is the course catalog. `admin/` is the admin dashboard. `sign-in/` + `sign-up/` are auth routes. `editor-sandbox/` is an isolated iframe with COOP/COEP headers for Wasmer WASM execution. `api/nio/` is the AI chat endpoint. `api/health/` is the health check endpoint.
- **`src/ui/`** — React components (all client-side). Organized by feature: `admin/` (dashboard), `auth/` (sign-in, boot sequence), `brand/` (wordmark, logos), `chat/` (AI chat), `code/` (editor, terminal, file tree), `content/` (lesson content), `courses/` (catalog, detail), `landing/` (hero, features), `layout/` (preset context, grid), `niotepad/` (floating notepad panel), `panes/` (workspace panes), `shared/` (ThemeToggle, NotebookFrame), `shell/` (SiteNav, TopNav), `transcript/`, `video/` (YouTube player).
- **`src/domain/`** — Pure business logic and types. No React, no side effects. AI prompt building (`nioPrompt.ts`, `nioContextBuilder.ts`), lesson environment config, niotepad types, chat/transcript/video types.
- **`src/infra/`** — Infrastructure layers:
  - `vfs/` — Virtual filesystem (in-memory tree + IndexedDB persistence via Zustand store)
  - `runtime/` — Multi-language code execution: JS (`new Function`), Python (Pyodide WASM), C (Wasmer WASM), HTML/CSS (iframe). Each language has its own executor + import resolver.
  - `ai/` — AI provider interfaces
  - `niotepad/` — Niotepad Zustand store + IndexedDB persistence
  - `cache/` — Local storage cache helpers (chat, transcript window)
  - `dev/` — Dev auth bypass helpers (E2E only)
- **`convex/`** — Convex backend functions. `schema.ts` defines the data model. Auth via Clerk JWT. Real-time queries/mutations consumed by React hooks.

### Key Patterns

- **State:** Zustand stores for client state (filesystem, terminal, layout). Convex React hooks (`useQuery`/`useMutation`) for remote state.
- **Code execution:** `runtimeManager.ts` routes to per-language executors. Python runs via Pyodide WASM, C via JSCPP in a Web Worker, JS via a disposable sandboxed iframe (blob URL, postMessage I/O), HTML/CSS via sandboxed iframe.
- **AI chat:** SSE streaming via `/api/nio/chat`. BYOK model — users supply their own API key (Gemini, OpenAI, or Anthropic). Context assembled from transcript segments + current code + video time.
- **Auth:** Clerk → JWT → Convex identity. Invite-only alpha. `useBootstrapUser.ts` initializes on load.
- **VFS:** In-memory tree serialized to IndexedDB. Powers multi-file editing with tabs and file tree sidebar.

## Conventions

- No `any` in `convex/` and `tests/`, no `unknown` in `src/domain` (enforced by CI scripts)
- Lefthook git hooks run lint/format checks pre-commit
- ESLint 9 flat config with Next.js + Prettier integration

## Agent Teams Guidelines

- All teammates: read this CLAUDE.md before starting work.
- Code style: `docs/guidelines.md`
- Test command: `bun run test`
- Build command: `bun run build`
- Branch strategy: create feature branches, never push to main directly.
- When in doubt about architecture decisions, message the lead instead of guessing.

## Remediation Work

All 50 remediation findings resolved across Waves 0–6 + Unit B (C executor Web Worker).
Historical plan archived at: docs/archive/REMEDIATION_PLAN.md
