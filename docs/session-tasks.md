# Session Tasks — Clerk Auth Alpha

> **ARCHIVED** — All tasks complete. Auth gate and e2e gating are stable on main.

## Status

- Current focus: Auth gate complete + e2e preview gating stabilized
- Branch: `main`
- Last updated: 2026-01-30

## Tasks

- [x] AUTH-1 — Implement Clerk auth gate + user bootstrap on `fix/auth-gate` (code + Convex auth config). Commit: `6a33067`.
- [x] AUTH-2 — Configure Clerk Dev instance (invite-only, paths, email code). Status: completed.
- [x] AUTH-3 — Set Convex env `CLERK_JWT_ISSUER_DOMAIN` on preview-data + prod and redeploy Convex. Status: completed.
- [x] AUTH-4 — Set Vercel Preview + Production env vars for Clerk Dev keys and `NIOTEBOOK_ADMIN_EMAILS`. Status: completed.
- [x] AUTH-5 — Verify sign-in flow and `users.inviteBatchId` sync; address Convex auth handshake errors. Status: completed.
- [x] AUTH-7 — Wait for `useConvexAuth()` before bootstrap and update Clerk redirects. Commit: `7e14dd2` (merged).
- [x] E2E-1 — Gate e2e runs to e2e-ready previews + main-only dispatch. Commit: `c6fa8bf`.
- [x] E2E-2 — Stabilize e2e chat message assertion. Commit: `bd70d9f`.

## Notes

- Alpha uses Clerk Dev keys for preview + prod until custom domain is live.
- Invite metadata may be set after sign-in if the invite UI hides metadata in Dev.
