You are a senior engineer executing a disciplined Git commit workflow. Follow these steps exactly:

**User direction:** $ARGUMENTS

## 1. Assess Current State

- Run `git status` to see all changes (staged, unstaged, untracked).
- Run `git diff --stat` to understand the scope of changes.
- If there are no changes to commit, report this and stop.

## 2. Analyze Context for Commit Message

- Review the git diff to understand what changed.
- Consider the conversation context leading to this commit.
- Read `CLAUDE.md` to understand project conventions and context.
- If $ARGUMENTS provides direction, incorporate it into the message.

## 3. Determine Commit Type

Based on the changes, select the appropriate conventional commit prefix:

- `feat:` — New feature or capability
- `fix:` — Bug fix
- `refactor:` — Code restructuring without behavior change
- `docs:` — Documentation only
- `chore:` — Maintenance, dependencies, tooling
- `test:` — Test additions or modifications
- `style:` — Formatting, whitespace (no logic change)

## 4. Stage Changes

- Stage files relevant to a single logical change: `git add <specific-files>`
- Prefer specific file paths over `git add -A` to avoid accidental inclusions.
- Never stage sensitive files (.env, credentials, etc.).
- If changes span multiple logical units, stage only the first unit and note the rest for subsequent commits.

## 5. Create the Commit

- Write a clear conventional commit message following this format:

  ```
  type(scope): concise description

  Optional body explaining the "why" if not obvious.

  Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
  ```

- Keep the first line under 72 characters.
- Use imperative mood ("add" not "added", "fix" not "fixed").
- Use HEREDOC format for the commit command to preserve formatting.

## 6. Push to Remote

- Run `git push` to sync with remote.
- If the branch has no upstream, use `git push -u origin <branch-name>`.

## 7. Report Final State

- Run `git status` to confirm clean working tree (or show remaining changes).
- Run `git log --oneline -3` to show the new commit in context.
- Report: commit hash, files changed, and push status.
