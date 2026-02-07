You are a senior engineer creating a pull request with full context inference. Follow these steps exactly:

**User direction:** $ARGUMENTS

## 1. Assess Current State

- Run `git status` to check for uncommitted changes.
- If the working tree is dirty, prompt to run `/clean-commit` first or ask user preference.
- Run `git branch --show-current` to get the current branch name.
- If on `main`, stop and report — PRs should be created from feature branches.

## 2. Gather Context for PR

- Run `git log --oneline main..HEAD` to see all commits on this branch.
- Run `git diff main...HEAD --stat` to see total files changed.
- Read `CLAUDE.md` to understand project conventions and context.
- If branch name contains feature info (e.g., `feat/ai-chat-retry`), note it.

## 3. Check Remote Sync

- Run `git fetch origin` to ensure we have latest remote state.
- Run `git status` to check if local is ahead/behind remote.
- If local commits aren't pushed, run `git push` first.
- Verify the remote branch exists: `git ls-remote --heads origin <branch-name>`.

## 4. Generate PR Title

Based on branch name and commits, generate a concise title:

- Use conventional commit style: `type(scope): description`
- Keep under 70 characters.
- Examples:
  - `feat(chat): implement AI chat retry with SSE streaming`
  - `fix(vfs): resolve file tree sync on tab switch`
  - `refactor(runtime): extract Python executor to separate module`

## 5. Generate PR Body

Create a structured PR body:

```markdown
## Summary

<2-4 bullet points describing what this PR does, inferred from commits>

## Changes

<List of key files changed with brief description>

## Test Plan

- [ ] <Verification steps based on what was changed>
- [ ] `bun run typecheck && bun run lint && bun run test` passes

---

Generated with [Claude Code](https://claude.ai/code)
```

## 6. Create the PR

- Use `gh pr create` with HEREDOC for body formatting:
  ```bash
  gh pr create --title "<title>" --body "$(cat <<'EOF'
  <body content>
  EOF
  )"
  ```
- Target `main` branch by default unless $ARGUMENTS specifies otherwise.

## 7. Report Result

- Capture and display the PR URL.
- Run `gh pr view --json number,url,title` to confirm creation.
- Report:
  - PR number and URL
  - Title
  - Number of commits included
  - Files changed count
