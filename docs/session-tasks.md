# Session Tasks — Clerk Auth Alpha

## Status

- Current focus: Auth gate stabilization + Convex auth handshake
- Branch: `fix/auth-gate-followup`
- Last updated: 2026-01-30

## Tasks

- [x] AUTH-1 — Implement Clerk auth gate + user bootstrap on `fix/auth-gate` (code + Convex auth config). Commit: `6a33067`.
- [x] AUTH-2 — Configure Clerk Dev instance (invite-only, paths, email code). Status: completed.
- [x] AUTH-3 — Set Convex env `CLERK_JWT_ISSUER_DOMAIN` on preview-data + prod and redeploy Convex. Status: completed.
- [x] AUTH-4 — Set Vercel Preview + Production env vars for Clerk Dev keys and `NIOTEBOOK_ADMIN_EMAILS`. Status: completed.
- [~] AUTH-5 — Verify sign-in flow and `users.inviteBatchId` sync; address Convex auth handshake errors. Status: in_progress.
- [~] AUTH-7 — Wait for `useConvexAuth()` before bootstrap and update Clerk redirects. Commit: `7e14dd2` (pending PR).

## Notes

- Alpha uses Clerk Dev keys for preview + prod until custom domain is live.
- Invite metadata may be set after sign-in if the invite UI hides metadata in Dev.
