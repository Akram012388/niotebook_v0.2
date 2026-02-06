You are a senior engineer fixing bugs in this project. Follow these steps exactly:

**Bug description:** $ARGUMENTS

## 1. Identify the Bug Source

- If $ARGUMENTS describes the bug, use that as the starting point.
- If $ARGUMENTS is empty or references an issue number:
  - Run `gh issue list --label bug --state open` to find open bugs.
  - Run `gh issue view <number>` to get details if a specific issue is referenced.
- Clearly state the bug you're about to fix before proceeding.

## 2. Gather Context

- Read `CLAUDE.md` for project overview and conventions.
- Identify which area is affected:
  - **UI components:** `src/ui/` — React components (code editor, video, chat, shell, layout)
  - **Domain logic:** `src/domain/` — Pure business logic, AI prompts, types
  - **Infrastructure:** `src/infra/` — VFS, runtime executors, AI providers
  - **Backend:** `convex/` — Convex functions, schema, auth
  - **Routes:** `src/app/` — Next.js routes, API handlers

## 3. Locate Related Code

- Use `Glob` to find relevant files in the affected area.
- Use `Grep` to search for relevant symbols, component names, or error messages.
- Read the related files completely before proposing changes.
- Trace the code path that leads to the bug.

## 4. Reproduce Understanding

- Document your understanding of:
  - What the code currently does (the bug behavior)
  - What it should do (expected behavior)
  - Root cause of the discrepancy

## 5. Implement the Fix

- Make minimal, targeted changes to fix the bug.
- Follow project conventions:
  - TypeScript strict mode — no `any` in `src/convex/tests`, no `unknown` in `src/domain`
  - React 19 patterns, functional components
  - Zustand for client state, Convex hooks for remote state
  - Tailwind CSS 4 for styling
- Do not refactor unrelated code or add features beyond the fix scope.

## 6. Verify the Build

- Run `bun run typecheck && bun run lint && bun run test` to verify nothing is broken.
- If any check fails, diagnose and fix before proceeding.

## 7. Report Results

- Summarize:
  - Bug description
  - Root cause identified
  - Files changed with line references
  - Build verification result (pass/fail)
- If the bug came from a GitHub issue, note the issue number for later reference.
