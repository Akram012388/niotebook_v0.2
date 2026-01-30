# Niotebook v0.2

AI-native learning workspace that synchronizes Video + Code + AI.

## Highlights

- Multi-pane workspace (video, code, assistant) with layout presets + keyboard shortcuts.
- **Tier 2 Code Editor:** CodeMirror 6 with file tree sidebar, tabbed multi-file editing, xterm.js terminal, resizable split-pane, virtual filesystem (VFS) with IndexedDB persistence, cross-file imports (Python/C/JS), lesson-aware environment configs, Wasmer/WASIX sandbox via iframe isolation, and enhanced autocomplete.
- Control center drawer for lectures/courses, search, share/feedback, and settings.
- Resume-aware playback + transcript context (CS50x 2026 ingest pipeline ready).
- Convex-backed data model for courses, lessons, chat, and resume snapshots.

## Getting Started

- Requirements: Node 20.x, Bun 1.1.x (run `exec /bin/zsh` after installing Bun).
- Install dependencies: `bun install`.
- Copy `.env.example` to `.env.local` and set at least `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_URL`.
- Start the app: `bun run dev` and open `http://localhost:3000`.
- Optional: run Convex locally with `bun run dev:convex`.
- Auth for alpha is Clerk invite-only (email code). See `docs/clerk-auth-alpha.md`.

## Scripts

- Dev: `bun run dev`
- Lint: `bun run lint`
- Typecheck: `bun run typecheck`
- Unit tests: `bun run test`
- E2E (CI-style): `bun run test:e2e`
- E2E (local): `bun run test:e2e:local`
- Ingest CS50x 2026: `bun run ingest:cs50x`

## Data Ingest

- `bun run ingest:cs50x` seeds CS50x 2026 lessons/transcripts into Convex.
- Ingest and transcript verification require `NIOTEBOOK_INGEST_TOKEN` when running against preview-data or prod.

## Docs

- `docs/PRD.md`
- `docs/specs.md`
- `docs/plan.md`
- `docs/dev-workflow.md`
- `docs/env-requirements.md` (environment setup + secrets)
- `docs/clerk-auth-alpha.md` (auth gate plan)
- `docs/ui-ux-contract.md` (binding UI/UX contract)
- `docs/ui-reference.md`
- `docs/session-tasks.md`
- `docs/code-editor-tier2-plan.md` (Tier 2 code editor implementation plan)
