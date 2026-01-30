# Session Tasks — Clerk Auth Alpha

## Status

- Current focus: Auth gate rollout + Clerk/Convex wiring
- Branch: `fix/auth-gate`
- Last updated: 2026-01-30

## Tasks

- [x] AUTH-1 — Implement Clerk auth gate + user bootstrap on `fix/auth-gate` (code + Convex auth config). Commit: `6a33067`.
- [~] AUTH-2 — Configure Clerk Dev instance (invite-only, paths, email code). Status: in_progress.
- [~] AUTH-3 — Set Convex env `CLERK_JWT_ISSUER_DOMAIN` on preview-data + prod and redeploy Convex. Status: pending.
- [~] AUTH-4 — Set Vercel Preview + Production env vars for Clerk Dev keys and `NIOTEBOOK_ADMIN_EMAILS`. Status: pending.
- [~] AUTH-5 — Verify sign-in flow and `users.inviteBatchId` sync; run preview-data refresh after deploy. Status: pending.
- [~] AUTH-6 — Open PR from `fix/auth-gate` and merge to `main` once verification passes. Status: pending.

## Notes

- Alpha uses Clerk Dev keys for preview + prod until custom domain is live.
- Invite metadata may be set after sign-in if the invite UI hides metadata in Dev.
