# Niotebook v0.2

An AI-native learning workspace that synchronizes **Video**, **Code**, and **AI** into a single, real-time environment. Niotebook lets learners watch lecture videos, write and execute code in multiple languages, and chat with an AI assistant—all in one coordinated interface where each pane shares context with the others.

## Overview

Niotebook is built around the idea that learning to code is most effective when video instruction, hands-on coding, and AI assistance happen together. The workspace is organized into synchronized panes:

- **Video Pane** — YouTube-based lecture playback with time-synced transcript segments, resume-aware bookmarking, and chapter navigation.
- **Code Pane** — A full-featured CodeMirror 6 editor with a file tree sidebar, tabbed multi-file editing, an xterm.js terminal, and in-browser execution for 7 languages.
- **AI Pane** — A chat assistant (powered by Gemini, with Groq fallback) that automatically incorporates the current video timestamp, transcript context, and code state into its responses.

Layout presets and keyboard shortcuts let you switch between different pane arrangements depending on what you're doing—watching, coding, or asking questions.

## Features

### Multi-Language Code Execution

Code runs entirely in the browser via WebAssembly and sandboxed runtimes:

| Language | Runtime |
|----------|---------|
| JavaScript | `new Function()` sandbox |
| Python | Pyodide (WASM) |
| C / C++ | JSCPP + Wasmer/WASIX (isolated iframe with COOP/COEP) |
| HTML / CSS | iframe preview |
| SQL | sql.js (WASM) |
| R | WebR (WASM) |

Each lesson can define its own environment config—starter files, language presets, and available packages—so the editor adapts to the lecture content automatically.

### Virtual Filesystem (VFS)

An in-memory file tree persisted to IndexedDB via Zustand. Supports multi-file projects with cross-file imports (Python, C, JS), a file tree sidebar, and tabbed editing. 1 MB per-file limit, 50 MB total.

### AI Chat with Full Context

The AI assistant receives:
- Current transcript window around the video playback position
- The learner's code from the active editor
- Video timestamp and lesson metadata

Streaming responses are delivered via SSE from the `/api/nio/chat` endpoint. Gemini 2.5 Flash is the primary provider; Groq is the automatic fallback.

### Course & Lesson Management

- Convex-backed data model for courses, lessons, chapters, and transcript segments.
- CS50x 2026 ingest pipeline seeds lessons and transcripts from YouTube.
- Resume snapshots and lesson completion tracking per user.
- Code snapshots with content hashing for version history.

### Admin Dashboard

Role-gated admin routes (`/admin`) for user management, invite code management, feedback review, and analytics.

### Auth

Clerk-based invite-only alpha. Clerk issues JWTs consumed by Convex for identity. Invite codes with expiry, batch tracking, and role assignment.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4 |
| Language | TypeScript (strict mode) |
| Backend | Convex 1.31 (serverless DB, real-time subscriptions) |
| Auth | Clerk (@clerk/nextjs 6.37) |
| Editor | CodeMirror 6 (JS, Python, C++, HTML, CSS, SQL, R) |
| Terminal | xterm.js 5.5 |
| State | Zustand 5 (client), Convex React hooks (remote) |
| AI | Google Gemini (primary), Groq (fallback) |
| WASM Runtimes | Pyodide, Wasmer/WASIX, sql.js, WebR, JSCPP |
| Icons | Phosphor Icons |
| Monitoring | Sentry |
| Testing | Vitest, Playwright, Testing Library |
| Package Manager | Bun 1.1 |

## Project Structure

```
src/
├── app/            # Next.js App Router (workspace, courses, admin, editor-sandbox, API)
├── ui/             # React components by feature (code, video, chat, shell, layout, admin, auth, courses, landing)
├── domain/         # Pure business logic & types (no React, no side effects)
└── infra/          # Infrastructure (VFS, multi-language runtime, AI streaming, Convex client)
convex/             # Backend functions, schema, auth, crons
docs/               # 23 documentation files (PRD, specs, ADRs, plans)
tests/              # Unit & E2E tests
```

## Getting Started

**Requirements:** Node 20.x, Bun 1.1.x

```bash
bun install
cp .env.example .env.local
# Set at minimum: NEXT_PUBLIC_CONVEX_URL, CONVEX_URL,
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
bun run dev
```

Open `http://localhost:3000`. Optionally run the Convex dev server with `bun run dev:convex`.

Auth is Clerk invite-only for the alpha. See `docs/clerk-auth-alpha.md`.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Next.js dev server (Turbopack) |
| `bun run dev:convex` | Convex backend dev server |
| `bun run build` | Production build |
| `bun run lint` | ESLint 9 + Prettier |
| `bun run typecheck` | TypeScript strict check |
| `bun run format` | Prettier format |
| `bun run test` | Unit tests (Vitest) |
| `bun run test:e2e` | E2E tests (Playwright) |
| `bun run ingest:cs50x` | Seed CS50x 2026 lessons/transcripts into Convex |

Run a single test: `bunx vitest run path/to/test.ts` or `bunx playwright test path/to/test.ts`.

## Data Ingest

`bun run ingest:cs50x` seeds CS50x 2026 lessons and transcripts into Convex. Ingest and transcript verification require `NIOTEBOOK_INGEST_TOKEN` when running against preview or production deployments.

## Environment Variables

See `.env.example` for the full list. Key groups:

- **Convex** — `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_URL`
- **Clerk** — `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_JWT_ISSUER_DOMAIN`
- **AI** — `GEMINI_API_KEY` (primary), `GROQ_API_KEY` (fallback)
- **Monitoring** — `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`
- **Admin** — `NIOTEBOOK_ADMIN_EMAILS`

## Documentation

| Doc | Description |
|-----|-------------|
| `docs/PRD.md` | Product requirements |
| `docs/specs.md` | Technical specifications |
| `docs/plan.md` | Project plan |
| `docs/dev-workflow.md` | Development workflow |
| `docs/env-requirements.md` | Environment setup & secrets |
| `docs/clerk-auth-alpha.md` | Auth gate plan |
| `docs/ui-ux-contract.md` | Binding UI/UX contract |
| `docs/ui-reference.md` | UI component reference |
| `docs/code-editor-tier2-plan.md` | Code editor implementation plan |
| `docs/editor-support-r-sql.md` | R & SQL language support |
| `docs/landing-page.md` | Landing page specs |
| `docs/guidelines.md` | Code guidelines |
| `docs/CHANGELOG.md` | Version history |
| `docs/ADR-*.md` | Architecture decision records |
