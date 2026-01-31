# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev          # Next.js dev server (Turbopack)
bun run dev:convex   # Convex backend dev server
bun run build        # Production build
bun run lint         # ESLint 9 + Prettier
bun run typecheck    # TypeScript strict check
bun run format       # Prettier format
bun run format:check # Prettier check only
bun run test         # Unit tests (Vitest)
bun run test:e2e     # E2E tests (Playwright)
bun run check:any    # Forbids `any` in src/convex/tests
bun run check:unknown # Forbids `unknown` in src/domain
```

Run a single unit test: `bunx vitest run path/to/test.ts`
Run a single E2E test: `bunx playwright test path/to/test.ts`

## Architecture

**Stack:** Next.js 16 (App Router, React 19) · TypeScript strict · Tailwind CSS 4 · Convex (serverless backend) · Clerk (auth) · Bun

**Path alias:** `@/*` → `./src/*`

### Source Layout

- **`src/app/`** — Next.js routes. `workspace/` is the main protected route. `editor-sandbox/` is an isolated iframe with COOP/COEP headers for Wasmer WASM execution.
- **`src/ui/`** — React components (all client-side). Organized by feature: `code/` (editor, terminal, file tree), `video/` (YouTube player), `chat/` (AI chat), `transcript/`, `shell/` (AppShell, TopNav), `layout/` (preset context, grid).
- **`src/domain/`** — Pure business logic and types. No React, no side effects. AI prompt building (`nioPrompt.ts`, `nioContextBuilder.ts`), lesson environment config, chat/transcript/video types.
- **`src/infra/`** — Infrastructure layers:
  - `vfs/` — Virtual filesystem (in-memory tree + IndexedDB persistence via Zustand store)
  - `runtime/` — Multi-language code execution: JS (`new Function`), Python (Pyodide WASM), C (Wasmer WASM), HTML/CSS (iframe). Each language has its own executor + import resolver.
  - `ai/` — AI provider interfaces
- **`convex/`** — Convex backend functions. `schema.ts` defines the data model. Auth via Clerk JWT. Real-time queries/mutations consumed by React hooks.

### Key Patterns

- **State:** Zustand stores for client state (filesystem, terminal, layout). Convex React hooks (`useQuery`/`useMutation`) for remote state.
- **Code execution:** `runtimeManager.ts` routes to per-language executors. Python runs via Pyodide, C via Wasmer (in sandboxed iframe), JS via `new Function()`.
- **AI chat:** SSE streaming via `/api/nio/chat`. Gemini primary, Groq fallback. Context assembled from transcript segments + current code + video time.
- **Auth:** Clerk → JWT → Convex identity. Invite-only alpha. `useBootstrapUser.ts` initializes on load.
- **VFS:** In-memory tree serialized to IndexedDB. Powers multi-file editing with tabs and file tree sidebar.

## Conventions

- No `any` in `src/convex/tests`, no `unknown` in `src/domain` (enforced by CI scripts)
- Lefthook git hooks run lint/format checks pre-commit
- ESLint 9 flat config with Next.js + Prettier integration
