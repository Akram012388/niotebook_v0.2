You are a senior engineer executing a disciplined Git merge workflow. Follow these steps exactly:

**User direction:** $ARGUMENTS

## 1. Assess Current State

- Run `git status` to check for uncommitted changes.
- If the working tree is dirty, ask the user whether to stash or commit before proceeding. Do not continue with a dirty tree.

## 2. Identify the PR to Merge

- Based on $ARGUMENTS or the current branch, identify the target PR.
- Run `gh pr list --state open` to see open PRs if no specific PR is given.
- Run `gh pr view <pr-number-or-branch> --json title,number,headRefName,baseRefName,mergeable,statusCheckRollup` to confirm:
  - The PR targets `main`.
  - All status checks pass.
  - The PR is mergeable (no conflicts).
- If checks are failing or there are conflicts, report the issue and stop.

## 3. Merge the PR

- Use `gh pr merge <pr-number> --merge --delete-branch` to:
  - Merge with a merge commit (preserving branch history).
  - Delete the remote feature branch after merge.
- If $ARGUMENTS specifies a different merge strategy (squash, rebase), honor that instead.

## 4. Switch to Main and Sync

- Run `git checkout main` to switch to the main branch.
- Run `git pull origin main` to update local main with the merged changes.
- Run `git branch -d <feature-branch>` to clean up the local feature branch (if it exists).

## 5. Prune Stale References

- Run `git fetch --prune` to remove any stale remote-tracking references.

## 6. Report Final State

- Run `git status` and confirm a clean working tree.
- Run `git log --oneline -5` to show the recent history including the merge.
- Report back: current branch, working tree status, and the last few commits.
