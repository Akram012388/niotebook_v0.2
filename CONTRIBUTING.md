# Contributing to Niotebook

Thank you for contributing to Niotebook — an AI-powered coding workspace for online learners.

## Table of Contents

- [Getting Started](#getting-started)
- [Repository Layout](#repository-layout)
- [Branch Naming](#branch-naming)
- [Development Commands](#development-commands)
- [Making a Change](#making-a-change)
- [PR Requirements](#pr-requirements)
- [Commit Message Format](#commit-message-format)
- [Code Style](#code-style)
- [Agent Team Guidelines](#agent-team-guidelines)

---

## Getting Started

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/niotebook_v0.2.git
cd niotebook_v0.2

# 2. Install dependencies
bun install

# 3. Copy env template and fill in required values
cp .env.example .env.local
# Edit .env.local — see docs/env-requirements.md for full reference

# 4. Start the Convex backend dev server (separate terminal)
bun run dev:convex

# 5. Start the Next.js dev server
bun run dev
```

### Prerequisites

- [Bun](https://bun.sh) >= 1.1.19
- A [Convex](https://convex.dev) account (free tier works for development)
- A [Clerk](https://clerk.com) account for auth

### Minimum .env.local for local dev

```
NEXT_PUBLIC_CONVEX_URL=<your Convex dev URL>
CONVEX_URL=<same as above>
NIOTEBOOK_KEY_ENCRYPTION_SECRET=<generate: openssl rand -base64 32>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<from Clerk dashboard>
CLERK_SECRET_KEY=<from Clerk dashboard>
NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS=true
NIOTEBOOK_ALLOW_DEV_BYPASS_IN_DEV=true
```

---

## Repository Layout

```
src/
  app/         Next.js routes (App Router)
  ui/          React components, organized by feature
  domain/      Pure business logic and types — NO I/O, NO framework imports
  infra/       Infrastructure adapters (VFS, runtime, AI providers, email)
convex/        Convex backend functions and schema
tests/
  unit/        Vitest unit tests
  e2e/         Playwright end-to-end tests
docs/          ADRs, design docs, guidelines, env requirements
```

**Layer rules (strictly enforced):**

| Layer         | Rule                                                                   |
| ------------- | ---------------------------------------------------------------------- |
| `src/domain/` | No I/O, no React, no framework imports. Pure functions and types only. |
| `src/infra/`  | Adapters and side-effectful infrastructure. May import from `domain/`. |
| `src/ui/`     | React components. May import from `domain/` and `infra/`.              |
| `src/app/`    | Next.js routes and API handlers. Thin orchestration only.              |
| `convex/`     | Convex backend. `any` is forbidden; validate all inputs at boundaries. |

See `docs/guidelines.md` for the full code style reference and `docs/ADR-006-architecture-layers.md` for the architectural rationale behind these boundaries.

---

## Branch Naming

All branches must follow this convention:

```
fix/SEC-<ID>-<short-desc>       # Security fix        e.g. fix/SEC-01-gmail-csrf
fix/PERF-<ID>-<short-desc>      # Performance fix     e.g. fix/PERF-C1-c-executor-worker
refactor/ARCH-<short-desc>      # Architecture refactor  e.g. refactor/ARCH-split-ops-ts
test/TEST-<short-desc>          # Test coverage       e.g. test/TEST-prompt-injection
docs/oss-<short-desc>           # Documentation       e.g. docs/oss-contributing
feat/<short-desc>               # New feature
chore/<short-desc>              # Tooling, deps, config
```

Finding IDs come from `docs/REMEDIATION_PLAN.md` (e.g. `P0-3`, `HIGH-01`, `SEC-01`).

---

## Development Commands

```bash
bun run dev           # Next.js dev server (Turbopack)
bun run dev:convex    # Convex backend dev server
bun run build         # Production build
bun run lint          # ESLint 9
bun run typecheck     # TypeScript strict check
bun run format        # Prettier format (auto-fix)
bun run format:check  # Prettier check (CI mode)
bun run test          # Unit tests (Vitest)
bun run test:e2e      # E2E tests (Playwright)
bun run check:any     # Forbids `any` in convex/ and tests/
bun run check:unknown # Forbids `unknown` in src/domain/
```

Run a single unit test:

```bash
bunx vitest run tests/unit/path/to/test.ts
```

Run a single E2E test:

```bash
bunx playwright test tests/e2e/path/to/test.ts
```

---

## Making a Change

1. **Pick a task** — check open issues or items in `docs/REMEDIATION_PLAN.md`.
2. **Create a branch** following the naming convention above.
3. **Make your changes** — keep scope small and focused (one logical change per PR).
4. **Run the full check suite** locally before pushing:

```bash
bun run typecheck && bun run lint && bun run format:check && bun run test
```

5. **Open a PR** against `main` using the PR template.

---

## PR Requirements

Every PR must satisfy all of the following before merge:

- [ ] `bun run typecheck` — zero TypeScript errors
- [ ] `bun run lint` — zero ESLint violations
- [ ] `bun run format:check` — code formatted by Prettier
- [ ] `bun run test` — all unit tests pass, no regressions
- [ ] New or changed logic has corresponding tests
- [ ] No `any` added to `convex/` or `tests/`; no `unknown` added to `src/domain/`
- [ ] If addressing a finding from `docs/REMEDIATION_PLAN.md`, the finding ID is referenced in the PR description (e.g., "Fixes P0-3 — SSRF via subtitlesUrl")

---

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary in imperative mood>

[optional body — what and why, not how]

[optional footer — BREAKING CHANGE, Fixes #<issue>]
```

**Types:** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`

**Examples:**

```
fix(auth): remove PII from Convex auth failure log (P0-1)
feat(chat): add per-field max-length validation on Nio request body
refactor(ops): split convex/ops.ts into analytics, seed, ingest modules
test(domain): add behavioral tests for lectureNumber URL patterns
docs(oss): add CONTRIBUTING.md and .env.example
```

---

## Code Style

Full style reference: `docs/guidelines.md`

Quick summary:

- TypeScript strict — `any` is forbidden everywhere; `unknown` must be narrowed immediately at trust boundaries.
- `camelCase` for variables/functions; `PascalCase` for types/components; `SCREAMING_SNAKE_CASE` for true constants.
- Boolean names start with `is`/`has`/`can`/`should`.
- Event handlers start with `handle`; event props start with `on`.
- Every function must have an explicit return type.
- Prefer type aliases over `interface` unless declaration merging is required.

---

## Agent Team Guidelines

Niotebook uses Claude Code agent teams for parallel development. If you are an AI agent:

- Read `CLAUDE.md` before starting any work.
- Read `docs/guidelines.md` for code style rules.
- Read `docs/REMEDIATION_PLAN.md` to understand the current wave and open findings.
- Read the relevant ADR before touching architecture-sensitive files.
- Never push to `main` directly — always use a feature branch.
- When in doubt about an architecture decision, surface the question rather than guessing.
- All PRs must pass: `bun run typecheck && bun run lint && bun run format:check && bun run test`.
- Reference finding IDs in PR descriptions when addressing remediation work.
