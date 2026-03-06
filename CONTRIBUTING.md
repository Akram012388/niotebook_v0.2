# Contributing to Niotebook

Thanks for your interest in contributing.

## Before You Start

Read `CLAUDE.md` for project conventions, architecture, and commands.
Read `docs/guidelines.md` for code style.

## Branch Strategy

- Never push directly to `main`
- Create a feature branch: `git checkout -b feat/your-feature`
- Open a PR when ready

## Development Setup

1. Clone the repo
2. Install dependencies: `bun install`
3. Copy env file: `cp .env.example .env.local` and fill in your values
4. Start Convex backend: `bun run dev:convex`
5. Start Next.js: `bun run dev`

## Required Checks (must pass before merging)

```bash
bun run typecheck   # TypeScript strict
bun run lint        # ESLint 9
bun run test        # Vitest unit tests
bun run build       # Production build
```

## Code Rules

- No `any` in `convex/` or `tests/`
- No `unknown` in `src/domain/`
- Lefthook runs lint + typecheck on pre-commit automatically

## PR Expectations

- All checks pass
- Clear description of what changes and why
- Focused — one logical change per PR
