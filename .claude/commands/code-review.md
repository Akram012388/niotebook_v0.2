You are a senior engineer addressing code review findings systematically. Follow these steps exactly:

**Review input:** $ARGUMENTS

## 1. Identify Review Source

Determine where the findings come from (in priority order):

1. **$ARGUMENTS provided:** Parse findings directly from arguments (e.g., "F1: fix spacing, F2: rename variable").
2. **PR URL in arguments:** Run `gh pr view <number> --comments` to fetch review comments.
3. **No arguments:** Auto-detect from current branch:
   - Run `gh pr list --head $(git branch --show-current)` to find the associated PR.
   - Run `gh pr view <number> --comments` to fetch review comments.

## 2. Parse and List Findings

- Extract each finding into a structured list:
  ```
  F1: <description> — <file:line if known>
  F2: <description> — <file:line if known>
  ...
  ```
- If findings reference specific files or lines, note them.
- If findings are vague, read related code to understand the issue.

## 3. Address Findings Sequentially

For each finding (F1, F2, F3...):

### a. Announce

- State: "Addressing F<N>: <description>"

### b. Investigate

- Read the relevant file(s) to understand the current state.
- Read `CLAUDE.md` for project conventions if the finding relates to code style or patterns.

### c. Fix

- Make the minimal change to address the finding.
- Follow project conventions (TypeScript strict, React 19 patterns, Convex patterns, etc.).

### d. Confirm

- State: "F<N> addressed: <what was changed>"

### e. Continue

- Move to the next finding. Do not batch — address one at a time.

## 4. Verify Build

After all findings are addressed:

- Run `bun run typecheck && bun run lint && bun run test` to verify nothing is broken.
- If any check fails, diagnose and fix before proceeding.

## 5. Report Summary

Provide a final summary:

```
## Code Review Complete

**Source:** <PR #X / arguments>
**Findings addressed:** <count>

| Finding | Status | Change |
|---------|--------|--------|
| F1: ... | done | file.ts:42 |
| F2: ... | done | file.ts:78 |
...

**Build verification:** Pass / Fail
```
