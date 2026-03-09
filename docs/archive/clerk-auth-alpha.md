# Clerk Auth Alpha Plan

This document records the agreed alpha authentication plan for Niotebook v0.2.
It is the execution contract for the upcoming Clerk-based auth gate.

## Decisions (Locked)

- Auth provider: Clerk
- Auth method: email code
- Access model: invite-only (Clerk invitations)
- Invite codes: tracked as `inviteBatchId` metadata (no user-entered code UI)
- Admin access: email allowlist via `NIOTEBOOK_ADMIN_EMAILS`
- Domain: Vercel `*.vercel.app` only for alpha (custom domain later)

## Required Inputs

- Admin emails (allowlist): `admin@niotebook.com, niotebook@niotebook.com`
- Cohort tag format: `inviteBatchId` (example: `alpha-2026-01`)

## Phase 0 — Clerk Dashboard Setup ✅

1. Create Clerk app.
2. Enable email code auth.
3. Disable public sign-up (invite-only).
4. Allowed domains:
   - `http://localhost:3000`
   - `*.vercel.app`
5. Create invitations for alpha testers.
   - If the invite UI does not expose metadata in Dev, set `inviteBatchId` after first sign-in under Clerk → Users → Public metadata.
6. Record keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

## Phase 1 — Convex Auth Provider ✅

1. Add `convex/auth.config.ts` with Clerk provider configuration.
2. Set `CLERK_JWT_ISSUER_DOMAIN` in Convex environment variables for preview-data and prod.
   - Alpha uses the Dev issuer (e.g. `https://one-muskrat-8.clerk.accounts.dev`).
3. Deploy Convex to apply the auth config (`npx convex deploy`).
4. Verify `ctx.auth.getUserIdentity()` resolves Clerk identity in Convex functions.

## Phase 2 — App Integration (Auth Gate) ✅

Files (planned):

- `src/app/layout.tsx`
- `src/app/providers.tsx`
- `src/app/page.tsx`
- `src/app/sign-in/[[...sign-in]]/page.tsx`
- `src/app/sign-up/[[...sign-up]]/page.tsx`
- `src/ui/auth/AuthGate.tsx` (implemented and actively used on `/courses` and `/workspace`)

Actions:

- Wrap `ClerkProvider` in `src/app/layout.tsx`.
- Replace Convex provider with `ConvexProviderWithClerk` in `src/app/providers.tsx`.
- Add `/sign-in` and `/sign-up` routes using Clerk UI components.
- Landing page `/` is public (no auth gate). Auth gate is on `/courses` and `/workspace`.
- `SignedIn`: wait for `useConvexAuth()` to be authenticated before rendering workspace.

## Phase 3 — User Bootstrap + Invite Tracking ✅

Files (planned):

- `convex/users.ts` (new)
- `src/infra/useBootstrapUser.ts` (new)

Actions:

- Add `auth:upsertUser` mutation:
  - Reads `ctx.auth.getUserIdentity()`
  - Upserts `users` with:
    - `tokenIdentifier`
    - `email`
    - `inviteBatchId` (Clerk public metadata)
    - `role` (admin if email in `NIOTEBOOK_ADMIN_EMAILS`, else `user`)
- Call `auth:upsertUser` once on sign-in via a small client hook (only after Convex auth is ready).

## Phase 4 — Env + Docs

Add to `.env.example`:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=`
- `CLERK_SECRET_KEY=`
- `CLERK_JWT_ISSUER_DOMAIN=`
- `NIOTEBOOK_ADMIN_EMAILS=admin@niotebook.com,niotebook@niotebook.com`

Update docs:

- `README.md`
- `docs/env-requirements.md`
- `docs/dev-workflow.md`

## Phase 5 — Validation

Local checks:

- `bun run lint`
- `bun run typecheck`
- `bun run test`
- `bun run build`

Manual checks:

- Signed out → Clerk sign-in renders.
- Signed in → workspace loads without Convex auth errors.
- `users` table shows email + inviteBatchId + role.

## Phase 6 — Deployment

- Create branch for implementation.
- Open PR, merge to `main`.
- Vercel deploys automatically.
- Preview e2e runs require `NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW=true` to emit the
  `niotebook-e2e` readiness marker; CI skips previews without it.
- Invite alpha users via Clerk dashboard.
