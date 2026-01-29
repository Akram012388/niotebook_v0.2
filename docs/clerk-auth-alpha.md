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

- Admin emails (allowlist): `akram012388@gmail.com, niotebook@gmail.com`
- Cohort tag format: `inviteBatchId` (example: `alpha-2026-01`)

## Phase 0 — Clerk Dashboard Setup

1. Create Clerk app.
2. Enable email code auth.
3. Disable public sign-up (invite-only).
4. Allowed domains:
   - `http://localhost:3000`
   - `*.vercel.app`
5. Create invitations for alpha testers.
   - Set public metadata per invite:
     - `inviteBatchId: "alpha-2026-01"` (or cohort label)
     - optional `role: "admin"` (not required; admin is email-based)
6. Record keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

## Phase 1 — Convex Auth Provider

1. Convex dashboard → Auth → add Clerk provider.
2. Configure issuer + JWKS from Clerk.
3. Verify `ctx.auth.getUserIdentity()` resolves Clerk identity.

## Phase 2 — App Integration (Auth Gate)

Files (planned):

- `src/app/layout.tsx`
- `src/app/providers.tsx`
- `src/app/page.tsx`
- `src/app/sign-in/[[...sign-in]]/page.tsx`
- `src/app/sign-up/[[...sign-up]]/page.tsx`
- `src/ui/auth/AuthGate.tsx` (optional)

Actions:

- Wrap `ClerkProvider` in `src/app/layout.tsx`.
- Replace Convex provider with `ConvexProviderWithClerk` in `src/app/providers.tsx`.
- Add `/sign-in` and `/sign-up` routes using Clerk UI components.
- Gate `/` in `src/app/page.tsx`:
  - `SignedOut`: render Clerk sign-in
  - `SignedIn`: render `AppShell` + `WorkspaceShell`

## Phase 3 — User Bootstrap + Invite Tracking

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
- Call `auth:upsertUser` once on sign-in via a small client hook.

## Phase 4 — Env + Docs

Add to `.env.example`:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=`
- `CLERK_SECRET_KEY=`
- `NIOTEBOOK_ADMIN_EMAILS=akram012388@gmail.com,niotebook@gmail.com`

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
- Invite alpha users via Clerk dashboard.
