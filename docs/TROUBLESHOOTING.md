# Troubleshooting

Common issues and solutions when developing Niotebook.

## 1. Port 3000 already in use

**Error:** `EADDRINUSE: address already in use :::3000`

Kill the process occupying the port and restart:

```bash
lsof -ti:3000 | xargs kill -9
bun run dev
```

Or start the dev server on a different port:

```bash
bunx next dev -p 3001
```

## 2. Convex deployment not found

**Error:** Convex CLI cannot find a deployment or returns a "deployment not
found" error.

Run the Convex dev server and select your deployment when prompted:

```bash
bunx convex dev
```

## 3. Bun lockfile mismatch after branch switch

**Error:** `bun install` warns about a lockfile mismatch or modules are missing
after switching branches.

Re-install dependencies to sync the lockfile:

```bash
bun install
```

## 4. NEXT_PUBLIC_CONVEX_URL not set

**Error:** The app fails to start because `NEXT_PUBLIC_CONVEX_URL` is undefined.

Copy the example env file and fill in the required values:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and set `NEXT_PUBLIC_CONVEX_URL` to your Convex deployment
URL.

## 5. Clerk redirect loop in dev

**Symptom:** The browser keeps redirecting between sign-in and the app in local
development.

Enable the dev auth bypass by adding these variables to `.env.local`:

```env
NIOTEBOOK_DEV_AUTH_BYPASS=true
NIOTEBOOK_ALLOW_DEV_BYPASS_IN_DEV=true
```

## 6. E2E tests fail with "no lesson ID"

**Error:** Playwright tests fail because no lesson ID is available.

Seed the test data first:

```bash
bun run e2e:seed
```

Or set the lesson ID directly in `.env.local`:

```env
NEXT_PUBLIC_DEFAULT_LESSON_ID=<your-lesson-id>
```

## 7. TypeScript errors after pulling

**Error:** `tsc` reports type errors on code you did not change.

Dependencies or generated types may be out of date. Reinstall and recheck:

```bash
bun install && bun run typecheck
```
