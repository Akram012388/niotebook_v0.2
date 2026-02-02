You are a senior engineer executing a disciplined Git workflow. Follow these steps exactly:

**User direction:** $ARGUMENTS

## 1. Assess Current State

- Run `git status` and `git log --oneline -5` to understand where you are.
- Run `git stash list` to check for any stashed work.
- Ensure the working tree is clean. If there are uncommitted changes, ask the user whether to stash or discard them before proceeding.

## 2. Determine the Branch

- Based on the implementation plan (and any $ARGUMENTS direction), derive an appropriate branch name following this convention:
  - `feat/<short-descriptor>` for new features
  - `fix/<short-descriptor>` for bug fixes
  - `refactor/<short-descriptor>` for refactors
  - `chore/<short-descriptor>` for maintenance tasks
  - `docs/<short-descriptor>` for documentation
- Use lowercase kebab-case. Keep it concise but descriptive (e.g., `feat/ai-chat-retry-logic`).
- If a suitable branch already exists locally or on the remote, switch to it instead of creating a new one. Run `git branch -a | grep <descriptor>` to check.

## 3. Create or Switch to the Branch

- If creating: `git checkout -b <branch-name>` from `main` (ensure `main` is up-to-date first via `git pull origin main`).
- If switching: `git checkout <branch-name>` and `git pull` to sync.

## 4. Push Upstream to Sync

- Immediately push the new branch upstream: `git push -u origin <branch-name>`.
- This ensures local and remote are linked from the start.

## 5. Implement with Clean Atomic Commits

- Work through the implementation plan step by step.
- After each logical unit of work, create a focused atomic commit:
  - Stage only the files relevant to that change (`git add <specific-files>`).
  - Write a clear conventional commit message: `type: concise description` (e.g., `feat: add retry logic to AI chat SSE stream`).
  - Keep each commit small, self-contained, and buildable. Never bundle unrelated changes.
- Run `bun run typecheck && bun run lint` before each commit to catch issues early.
- Push periodically (`git push`) to keep remote in sync.

## 6. Final Check

- After all work is done, run `bun run typecheck && bun run lint && bun run test` to verify everything passes.
- Run `git log --oneline main..HEAD` to review the commit history and confirm it tells a clean, readable story.
- Report the branch name, commit count, and verification results to the user.
