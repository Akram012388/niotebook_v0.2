# OSS Transition Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert Niotebook from an invite-only alpha to a fully open-source project (MIT) with public access and a bring-your-own-key AI model (Gemini, OpenAI, Anthropic) with encrypted key storage in Convex.

**Architecture:** Two sequential tracks. Track 1 is pure documentation — no code changes. Track 2 is a single feature branch removing the invite gate, adding multi-provider BYOK AI with AES-256-GCM encrypted keys stored in Convex, and cleaning up invite management from the admin console.

**Tech Stack:** Next.js 16, Convex (serverless backend + key storage), Clerk (auth), TypeScript strict, Tailwind 4, Bun, Vitest

---

## Before You Start

Read these files to orient yourself:
- `CLAUDE.md` — project conventions, commands, architecture overview
- `docs/plans/2026-03-07-oss-transition-design.md` — the approved design this plan implements
- `docs/env-requirements.md` — all environment variables

Key commands:
```bash
bun run dev          # Next.js dev server
bun run dev:convex   # Convex backend (separate terminal)
bun run typecheck    # TypeScript check
bun run lint         # ESLint 9
bun run test         # Vitest unit tests
bun run build        # Production build
```

No `any` in `convex/` or `tests/`. No `unknown` in `src/domain/`.

---

## Track 1 — OSS Publication

Create branch: `feat/oss-publication`

These tasks produce no code changes — only documentation files.

---

### Task 1: Secrets scan

**Step 1: Run the scan**

```bash
cd /path/to/repo
git log --all -p | grep -iE "(api_key|secret|token|password)\s*[=:]\s*['\"]?[A-Za-z0-9_\-]{20,}" | head -40
```

**Step 2: Review output**

If the output is empty or only shows placeholder values (e.g. `...your key here...`), you're clear. The Figma API key was already cleaned up in commit `e708299`. No action needed.

If you see a live credential (real-looking key, not a placeholder), note it and confirm it has been rotated/invalidated before proceeding. Do NOT rewrite history.

**Step 3: No commit needed for this task.**

---

### Task 2: Create LICENSE

**Files:**
- Create: `LICENSE`

**Step 1: Write the file**

```
MIT License

Copyright (c) 2026 Akram

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**Step 2: No test needed.**

---

### Task 3: Create .env.example

**Files:**
- Create: `.env.example`

**Step 1: Write the file**

```bash
# =============================================================================
# Niotebook — Environment Variables
# Copy this file to .env.local and fill in your values.
# =============================================================================

# -----------------------------------------------------------------------------
# Convex (https://convex.dev — free tier available)
# -----------------------------------------------------------------------------
NEXT_PUBLIC_CONVEX_URL=

# Server-side Convex HTTP client (same URL as above)
CONVEX_URL=

# -----------------------------------------------------------------------------
# Clerk Auth (https://clerk.com — free tier up to 10,000 MAU)
# -----------------------------------------------------------------------------
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Comma-separated list of emails that receive admin role automatically
NIOTEBOOK_ADMIN_EMAILS=

# -----------------------------------------------------------------------------
# AI — Bring Your Own Key
# Users supply their own AI API keys via the settings panel.
# These server-side vars are no longer required for production.
# You may set them for local dev convenience (optional).
# -----------------------------------------------------------------------------

# [OPTIONAL] Google Gemini (https://aistudio.google.com — free tier available)
GEMINI_API_KEY=

# [OPTIONAL] Groq (https://console.groq.com — free tier available)
GROQ_API_KEY=

# -----------------------------------------------------------------------------
# API Key Encryption (required for BYOK AI feature)
# Generate with: openssl rand -base64 32
# Set this in both your Vercel env vars AND Convex dashboard env vars.
# -----------------------------------------------------------------------------
NIOTEBOOK_KEY_ENCRYPTION_SECRET=

# -----------------------------------------------------------------------------
# Feature toggles (dev/preview only — do NOT set in production)
# -----------------------------------------------------------------------------
NIOTEBOOK_E2E_PREVIEW=false
NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW=false
NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS=true
NIOTEBOOK_ALLOW_DEV_BYPASS_IN_DEV=true

# Set to true to disable Convex entirely (local-only mode)
# NEXT_PUBLIC_DISABLE_CONVEX=true
```

**Step 2: No test needed.**

---

### Task 4: Create CONTRIBUTING.md

**Files:**
- Create: `CONTRIBUTING.md`

**Step 1: Write the file**

```markdown
# Contributing to Niotebook

Thanks for your interest in contributing.

## Before You Start

Read `CLAUDE.md` for project conventions, architecture, and commands.
Read `docs/guidelines.md` for code style.

## Branch Strategy

- Never push directly to `main`
- Create a feature branch: `git checkout -b feat/your-feature`
- Open a PR when ready

## Development Setup

1. Clone the repo
2. Install dependencies: `bun install`
3. Copy env file: `cp .env.example .env.local` and fill in your values
4. Start Convex backend: `bun run dev:convex`
5. Start Next.js: `bun run dev`

## Required Checks (must pass before merging)

```bash
bun run typecheck   # TypeScript strict
bun run lint        # ESLint 9
bun run test        # Vitest unit tests
bun run build       # Production build
```

## Code Rules

- No `any` in `convex/` or `tests/`
- No `unknown` in `src/domain/`
- Lefthook runs lint + typecheck on pre-commit automatically

## PR Expectations

- All checks pass
- Clear description of what changes and why
- Focused — one logical change per PR
```

**Step 2: No test needed.**

---

### Task 5: Create README.md

**Files:**
- Create: `README.md` (root — replaces nothing, `docs/README.md` is separate)

**Step 1: Write the file**

```markdown
# Niotebook

A free, open-source learning companion for CS50 students. Watch lectures, write
and run code, and chat with Nio — an AI tutor that knows exactly where you are
in the course.

Built by someone six months into learning to program. The git history is the story.

## What It Does

- Embedded YouTube player synced to a code editor and AI chat
- Multi-language code execution: JavaScript, Python, C, HTML/CSS, SQL, R
- Nio AI chat — context-aware, transcript-grounded, bring your own API key
- Progress sync across devices via Convex
- Niotepad — a floating notepad that captures your thoughts and AI insights

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Backend | Convex (serverless, real-time) |
| Auth | Clerk (email OTP, free tier) |
| Runtime | Bun |
| Code execution | Pyodide (Python), Wasmer (C), native JS |

## Local Setup

### Prerequisites

- [Bun](https://bun.sh) 1.1.x
- [Convex account](https://convex.dev) (free)
- [Clerk account](https://clerk.com) (free)

### Steps

```bash
git clone https://github.com/your-username/niotebook
cd niotebook
bun install
cp .env.example .env.local
```

Fill in `.env.local` with your Convex and Clerk credentials (see table below).

```bash
# Terminal 1
bun run dev:convex

# Terminal 2
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex dashboard |
| `CONVEX_URL` | Yes | Same as above |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk dashboard |
| `CLERK_SECRET_KEY` | Yes | Clerk dashboard |
| `NIOTEBOOK_ADMIN_EMAILS` | Yes | Comma-separated list |
| `NIOTEBOOK_KEY_ENCRYPTION_SECRET` | Yes | `openssl rand -base64 32` |

See `.env.example` for the full list with descriptions.

## AI (Bring Your Own Key)

Nio AI chat requires users to supply their own API key. The app supports:

- **Google Gemini** — free tier available at [aistudio.google.com](https://aistudio.google.com)
- **OpenAI** — [platform.openai.com](https://platform.openai.com)
- **Anthropic** — [console.anthropic.com](https://console.anthropic.com)

Keys are stored encrypted (AES-256-GCM) in Convex. The raw key is never returned
to the client after saving. Users without a key can use all other features freely.

## Self-Hosting

1. Deploy Convex: `npx convex deploy`
2. Deploy to Vercel (or any Next.js host)
3. Set all env vars from `.env.example` in your deployment

### Content Licensing Notice

CS50 course content (transcripts, video metadata) is sourced from Harvard's CS50
courses and licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
(non-commercial, share-alike). The Niotebook codebase is MIT-licensed, but the
course content carries its own license. Self-hosters who ingest CS50 content are
responsible for compliance — specifically the **non-commercial restriction**.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
```

**Step 2: No test needed.**

---

### Task 6: Commit Track 1

**Step 1: Stage and commit**

```bash
git add LICENSE .env.example CONTRIBUTING.md README.md
git commit -m "docs: add MIT license, README, CONTRIBUTING, and .env.example for OSS publication"
```

**Step 2: Verify**

```bash
git log --oneline -3
```

Expected: your commit at the top with the docs files.

---

## Track 2 — Open Access + BYOK Nio

Create branch from main: `feat/open-access-byok`

```bash
git checkout main
git checkout -b feat/open-access-byok
```

---

### Task 7: Update domain types

**Files:**
- Modify: `src/domain/ai/types.ts`
- Modify: `src/infra/ai/providerTypes.ts`

**Step 1: Add `NO_API_KEY` to `NioErrorCode` in `src/domain/ai/types.ts`**

Find the `NioErrorCode` type (currently around line 42) and add `"NO_API_KEY"`:

```ts
type NioErrorCode =
  | "NO_API_KEY"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "PROVIDER_429"
  | "PROVIDER_5XX"
  | "TIMEOUT_FIRST_TOKEN"
  | "STREAM_ERROR";
```

**Step 2: Expand `NioProviderId` in `src/infra/ai/providerTypes.ts`**

Change line 3 from:
```ts
type NioProviderId = "gemini" | "groq";
```
To:
```ts
type NioProviderId = "gemini" | "groq" | "openai" | "anthropic";
```

**Step 3: Run typecheck**

```bash
bun run typecheck
```

Expected: no new errors (the new error code and providers aren't used yet, so no breakage).

**Step 4: Commit**

```bash
git add src/domain/ai/types.ts src/infra/ai/providerTypes.ts
git commit -m "feat: add NO_API_KEY error code and expand NioProviderId for BYOK"
```

---

### Task 8: Update Convex schema

**Files:**
- Modify: `convex/schema.ts`

**Step 1: Open `convex/schema.ts` and make three changes:**

**Change 1** — In the `users` table, remove `inviteBatchId` and add `activeAiProvider`:

Replace:
```ts
users: defineTable({
  tokenIdentifier: v.string(),
  email: v.optional(v.string()),
  role: v.union(v.literal("admin"), v.literal("user"), v.literal("guest")),
  inviteBatchId: v.optional(v.string()),
})
  .index("by_tokenIdentifier", ["tokenIdentifier"])
  .index("by_inviteBatchId", ["inviteBatchId"]),
```

With:
```ts
users: defineTable({
  tokenIdentifier: v.string(),
  email: v.optional(v.string()),
  role: v.union(v.literal("admin"), v.literal("user")),
  activeAiProvider: v.optional(
    v.union(v.literal("gemini"), v.literal("openai"), v.literal("anthropic")),
  ),
})
  .index("by_tokenIdentifier", ["tokenIdentifier"]),
```

**Change 2** — Remove the entire `invites` table definition (the block starting with `invites: defineTable({`).

**Change 3** — Add the `userApiKeys` table (after the `users` table):

```ts
userApiKeys: defineTable({
  userId: v.id("users"),
  provider: v.union(
    v.literal("gemini"),
    v.literal("openai"),
    v.literal("anthropic"),
  ),
  encryptedKey: v.string(),
  iv: v.string(),
  keyHint: v.string(),
  updatedAt: v.number(),
}).index("by_userId_provider", ["userId", "provider"]),
```

**Step 2: Run typecheck**

```bash
bun run typecheck
```

Expected: TypeScript errors because `inviteBatchId` and `invites` are still referenced in other files. That is expected — the next tasks fix those. Note the errors but don't fix them yet.

**Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat(schema): add userApiKeys table, remove invites table, add activeAiProvider to users"
```

---

### Task 9: Create encryption utilities

**Files:**
- Create: `convex/lib/crypto.ts`

**Step 1: Create the directory and file**

```bash
mkdir -p convex/lib
```

**Step 2: Write `convex/lib/crypto.ts`**

```ts
/**
 * AES-256-GCM encryption utilities for Convex actions.
 * Uses Web Crypto API available in the Convex runtime.
 * The secret is hashed with SHA-256 to produce a consistent 32-byte key.
 */

const deriveKey = async (secret: string): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(secret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", secretBytes);
  return crypto.subtle.importKey(
    "raw",
    hashBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
};

const toBase64 = (buffer: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

const fromBase64 = (b64: string): Uint8Array => {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
};

const encryptApiKey = async (
  plaintext: string,
  secret: string,
): Promise<{ encryptedKey: string; iv: string }> => {
  const key = await deriveKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext),
  );
  return {
    encryptedKey: toBase64(encrypted),
    iv: toBase64(iv.buffer),
  };
};

const decryptApiKey = async (
  encryptedKey: string,
  iv: string,
  secret: string,
): Promise<string> => {
  const key = await deriveKey(secret);
  const encryptedBytes = fromBase64(encryptedKey);
  const ivBytes = fromBase64(iv);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    encryptedBytes,
  );
  return new TextDecoder().decode(decrypted);
};

export { encryptApiKey, decryptApiKey };
```

**Step 3: Write the unit test**

Create `tests/convex/crypto.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { encryptApiKey, decryptApiKey } from "../../convex/lib/crypto";

describe("encryptApiKey / decryptApiKey", () => {
  it("round-trips a key correctly", async () => {
    const secret = "test-secret-value-for-unit-tests-only";
    const original = "sk-proj-abc123xyz";

    const { encryptedKey, iv } = await encryptApiKey(original, secret);
    const decrypted = await decryptApiKey(encryptedKey, iv, secret);

    expect(decrypted).toBe(original);
  });

  it("produces different ciphertext for the same input (random IV)", async () => {
    const secret = "test-secret";
    const key = "AIzaSyExample";

    const first = await encryptApiKey(key, secret);
    const second = await encryptApiKey(key, secret);

    expect(first.encryptedKey).not.toBe(second.encryptedKey);
    expect(first.iv).not.toBe(second.iv);
  });

  it("fails to decrypt with wrong secret", async () => {
    const { encryptedKey, iv } = await encryptApiKey("my-key", "correct-secret");

    await expect(
      decryptApiKey(encryptedKey, iv, "wrong-secret"),
    ).rejects.toThrow();
  });
});
```

**Step 4: Run the test**

```bash
bunx vitest run tests/convex/crypto.test.ts
```

Expected: 3 tests pass.

**Step 5: Commit**

```bash
git add convex/lib/crypto.ts tests/convex/crypto.test.ts
git commit -m "feat: add AES-256-GCM encryption utilities for Convex BYOK key storage"
```

---

### Task 10: Create convex/userApiKeys.ts

**Files:**
- Create: `convex/userApiKeys.ts`
- Modify: `convex/auth.ts` (add `requireActionUser` helper if not present)

**Step 1: Check `convex/auth.ts` for existing helpers**

Open `convex/auth.ts`. Look for a `requireActionUser` or similar helper. If it only has `requireMutationUser`, `requireQueryUser`, you need to add one for actions. Check the existing pattern and follow it exactly.

**Step 2: Write `convex/userApiKeys.ts`**

```ts
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { encryptApiKey, decryptApiKey } from "./lib/crypto";
import { toDomainId } from "./idUtils";

type Provider = "gemini" | "openai" | "anthropic";

type KeyHint = {
  provider: Provider;
  keyHint: string;
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

const _getUserByToken = internalQuery({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier),
      )
      .first();
  },
});

const _upsertKey = internalMutation({
  args: {
    userId: v.id("users"),
    provider: v.union(
      v.literal("gemini"),
      v.literal("openai"),
      v.literal("anthropic"),
    ),
    encryptedKey: v.string(),
    iv: v.string(),
    keyHint: v.string(),
    isFirstKey: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userApiKeys")
      .withIndex("by_userId_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        encryptedKey: args.encryptedKey,
        iv: args.iv,
        keyHint: args.keyHint,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userApiKeys", {
        userId: args.userId,
        provider: args.provider,
        encryptedKey: args.encryptedKey,
        iv: args.iv,
        keyHint: args.keyHint,
        updatedAt: Date.now(),
      });
    }

    // Auto-select first key
    if (args.isFirstKey) {
      const user = await ctx.db.get(args.userId);
      if (user && !user.activeAiProvider) {
        await ctx.db.patch(args.userId, { activeAiProvider: args.provider });
      }
    }
  },
});

const _getActiveKey = internalQuery({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier),
      )
      .first();

    if (!user?.activeAiProvider) {
      return null;
    }

    return ctx.db
      .query("userApiKeys")
      .withIndex("by_userId_provider", (q) =>
        q.eq("userId", user._id).eq("provider", user.activeAiProvider!),
      )
      .first();
  },
});

const _getKeysByUser = internalQuery({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier),
      )
      .first();

    if (!user) {
      return { keys: [], activeProvider: null };
    }

    const keys = await ctx.db
      .query("userApiKeys")
      .withIndex("by_userId_provider", (q) => q.eq("userId", user._id))
      .collect();

    return {
      keys,
      activeProvider: user.activeAiProvider ?? null,
    };
  },
});

// ─── Public actions ───────────────────────────────────────────────────────────

const save = action({
  args: {
    provider: v.union(
      v.literal("gemini"),
      v.literal("openai"),
      v.literal("anthropic"),
    ),
    key: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const trimmedKey = args.key.trim();
    if (!trimmedKey) {
      throw new Error("API key cannot be empty.");
    }

    const secret = process.env.NIOTEBOOK_KEY_ENCRYPTION_SECRET;
    if (!secret) {
      throw new Error("Encryption secret not configured.");
    }

    const keyHint = trimmedKey.slice(-4);
    const { encryptedKey, iv } = await encryptApiKey(trimmedKey, secret);

    const user = await ctx.runQuery(internal.userApiKeys._getUserByToken, {
      tokenIdentifier: identity.tokenIdentifier,
    });
    if (!user) {
      throw new Error("User record not found.");
    }

    const existingKeys = await ctx.runQuery(internal.userApiKeys._getKeysByUser, {
      tokenIdentifier: identity.tokenIdentifier,
    });
    const isFirstKey = existingKeys.keys.length === 0;

    await ctx.runMutation(internal.userApiKeys._upsertKey, {
      userId: user._id as GenericId<"users">,
      provider: args.provider,
      encryptedKey,
      iv,
      keyHint,
      isFirstKey,
    });
  },
});

const resolveForRequest = action({
  args: {},
  handler: async (ctx): Promise<{ provider: Provider; key: string } | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const secret = process.env.NIOTEBOOK_KEY_ENCRYPTION_SECRET;
    if (!secret) {
      return null;
    }

    const activeKey = await ctx.runQuery(internal.userApiKeys._getActiveKey, {
      tokenIdentifier: identity.tokenIdentifier,
    });

    if (!activeKey) {
      return null;
    }

    const key = await decryptApiKey(activeKey.encryptedKey, activeKey.iv, secret);

    return { provider: activeKey.provider, key };
  },
});

// ─── Public mutations ─────────────────────────────────────────────────────────

const remove = mutation({
  args: {
    provider: v.union(
      v.literal("gemini"),
      v.literal("openai"),
      v.literal("anthropic"),
    ),
  },
  handler: async (ctx, args): Promise<void> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      return;
    }

    const existing = await ctx.db
      .query("userApiKeys")
      .withIndex("by_userId_provider", (q) =>
        q.eq("userId", user._id).eq("provider", args.provider),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // If we removed the active provider, pick another or clear
    if (user.activeAiProvider === args.provider) {
      const remaining = await ctx.db
        .query("userApiKeys")
        .withIndex("by_userId_provider", (q) => q.eq("userId", user._id))
        .collect();

      const next = remaining.find((k) => k.provider !== args.provider);
      await ctx.db.patch(user._id, {
        activeAiProvider: next?.provider ?? undefined,
      });
    }
  },
});

const setActiveProvider = mutation({
  args: {
    provider: v.union(
      v.literal("gemini"),
      v.literal("openai"),
      v.literal("anthropic"),
    ),
  },
  handler: async (ctx, args): Promise<void> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      throw new Error("User record not found.");
    }

    // Verify the key exists before switching
    const keyExists = await ctx.db
      .query("userApiKeys")
      .withIndex("by_userId_provider", (q) =>
        q.eq("userId", user._id).eq("provider", args.provider),
      )
      .first();

    if (!keyExists) {
      throw new Error(`No saved key for provider: ${args.provider}`);
    }

    await ctx.db.patch(user._id, { activeAiProvider: args.provider });
  },
});

// ─── Public queries ───────────────────────────────────────────────────────────

const listHints = query({
  args: {},
  handler: async (ctx): Promise<(KeyHint & { isActive: boolean })[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      return [];
    }

    const keys = await ctx.db
      .query("userApiKeys")
      .withIndex("by_userId_provider", (q) => q.eq("userId", user._id))
      .collect();

    return keys.map((k) => ({
      provider: k.provider,
      keyHint: k.keyHint,
      isActive: user.activeAiProvider === k.provider,
    }));
  },
});

export {
  save,
  remove,
  setActiveProvider,
  listHints,
  resolveForRequest,
  _getUserByToken,
  _upsertKey,
  _getActiveKey,
  _getKeysByUser,
};
```

**Step 3: Run typecheck**

```bash
bun run typecheck
```

Expected: May show errors about `invites` still being referenced. Ignore those — they'll be fixed in Task 12. The `userApiKeys.ts` itself should type-check cleanly.

**Step 4: Commit**

```bash
git add convex/userApiKeys.ts convex/lib/
git commit -m "feat(convex): add userApiKeys actions/mutations for encrypted BYOK key storage"
```

---

### Task 11: Update convex/users.ts

**Files:**
- Modify: `convex/users.ts`
- Modify: `src/ui/auth/convexAuth.ts`
- Modify: `src/infra/useBootstrapUser.ts`

**Step 1: Update `convex/users.ts`**

Remove `inviteBatchId` everywhere. The file handles three things: `upsertUser`, `me`, `listAll`, `updateRole`.

Replace the entire file content with:

```ts
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMutationAdmin, requireQueryAdmin } from "./auth";
import { toDomainId } from "./idUtils";

type UserRecord = {
  _id: GenericId<"users">;
  _creationTime: number;
  tokenIdentifier: string;
  email?: string;
  role: "admin" | "user";
  activeAiProvider?: "gemini" | "openai" | "anthropic";
};

const parseAdminEmails = (): Set<string> => {
  const raw = process.env.NIOTEBOOK_ADMIN_EMAILS ?? "";
  const emails = raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return new Set(emails);
};

const upsertUser = mutation({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ userId: string; role: "admin" | "user" }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated.");
    }

    const tokenIdentifier = identity.tokenIdentifier;
    const email = identity.email?.toLowerCase();
    const adminEmails = parseAdminEmails();
    const role: "admin" | "user" =
      email && adminEmails.has(email) ? "admin" : "user";

    const existing = (await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (query) =>
        query.eq("tokenIdentifier", tokenIdentifier),
      )
      .first()) as UserRecord | null;

    if (existing) {
      await ctx.db.patch(existing._id, { email, role });
      return { userId: toDomainId(existing._id), role };
    }

    const userId = await ctx.db.insert("users", {
      tokenIdentifier,
      email,
      role,
    });

    return { userId: toDomainId(userId as GenericId<"users">), role };
  },
});

const me = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ role: "admin" | "user" } | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = (await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (query) =>
        query.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first()) as UserRecord | null;

    if (!user) {
      return null;
    }

    return { role: user.role };
  },
});

const listAll = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<
    Array<{
      id: string;
      email?: string;
      role: "admin" | "user";
      createdAt: number;
    }>
  > => {
    await requireQueryAdmin(ctx);

    const users = (await ctx.db.query("users").collect()) as UserRecord[];

    return users.map((user) => ({
      id: toDomainId(user._id),
      email: user.email,
      role: user.role,
      createdAt: user._creationTime,
    }));
  },
});

const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    await requireMutationAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { ok: false };
    }

    await ctx.db.patch(args.userId, { role: args.role });
    return { ok: true };
  },
});

export { upsertUser, me, listAll, updateRole };
```

**Step 2: Update `src/ui/auth/convexAuth.ts`**

Replace the file content with (removing `inviteBatchId` from types):

```ts
import { makeFunctionReference } from "convex/server";

type UpsertUserReference = import("convex/server").FunctionReference<
  "mutation",
  "public",
  Record<string, never>,
  { userId: string; role: "admin" | "user" }
>;

const upsertUserRef = makeFunctionReference<"mutation">(
  "users:upsertUser",
) as UpsertUserReference;

type MeReference = import("convex/server").FunctionReference<
  "query",
  "public",
  Record<string, never>,
  { role: "admin" | "user" } | null
>;

const meRef = makeFunctionReference<"query">("users:me") as MeReference;

export { upsertUserRef, meRef };
```

**Step 3: Update `src/infra/useBootstrapUser.ts`**

Remove the `inviteBatchId` logic. Replace the `upsertUser` call:

```ts
// Before:
const inviteBatchId =
  typeof user?.publicMetadata?.inviteBatchId === "string"
    ? user?.publicMetadata?.inviteBatchId
    : undefined;

void upsertUser({ inviteBatchId }).then(...)

// After — just call with no args:
void upsertUser({}).then(...)
```

Also remove the `user?.publicMetadata?.inviteBatchId` from the `useEffect` dependency array.

**Step 4: Run typecheck**

```bash
bun run typecheck
```

Expected: Fewer errors now. The `inviteBatchId` errors in these files should be gone.

**Step 5: Commit**

```bash
git add convex/users.ts src/ui/auth/convexAuth.ts src/infra/useBootstrapUser.ts
git commit -m "feat: remove inviteBatchId from users, simplify upsertUser to no-args"
```

---

### Task 12: Delete invite infrastructure

**Files to delete:**
- `convex/invites.ts`
- `src/domain/invites.ts`

**Files to check and clean:**
- `src/ui/shell/ControlCenterDrawer.tsx` — remove `inviteBatchId` from `UserInfo` type
- `src/ui/admin/UserManagement.tsx` — remove `inviteBatchId` column if present

**Step 1: Delete invite files**

```bash
rm convex/invites.ts
rm src/domain/invites.ts
```

**Step 2: Check UserManagement for inviteBatchId usage**

Open `src/ui/admin/UserManagement.tsx`. Find any reference to `inviteBatchId` and remove it (the column header, the cell rendering). The user list returned by `users:listAll` no longer includes this field.

**Step 3: Fix ControlCenterDrawer**

Open `src/ui/shell/ControlCenterDrawer.tsx`. Find the `UserInfo` type around line 34:

```ts
type UserInfo = {
  email: string | null;
  role: string | null;
  inviteBatchId: string | null;  // ← remove this line
};
```

Remove the `inviteBatchId` field. Then find all usages of `userInfo.inviteBatchId` in the component and remove those too (usually displayed in the user info section of the drawer).

**Step 4: Run typecheck**

```bash
bun run typecheck
```

Expected: No more `inviteBatchId` or `invites` errors. New errors might appear if the Convex generated types are stale (they auto-regenerate when `bun run dev:convex` is running).

**Step 5: Run the full check**

```bash
bun run lint && bun run typecheck && bun run test
```

Expected: All pass. Fix any remaining issues before committing.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: remove invite infrastructure (convex/invites.ts, domain/invites.ts, UI references)"
```

---

### Task 13: Delete admin invites panel

**Files to delete:**
- `src/app/admin/invites/page.tsx`
- `src/ui/admin/InviteManagement.tsx`

**Files to modify:**
- `src/ui/admin/AdminLayout.tsx`

**Step 1: Delete the files**

```bash
rm src/app/admin/invites/page.tsx
rm src/ui/admin/InviteManagement.tsx
```

**Step 2: Remove the Invites nav item from `src/ui/admin/AdminLayout.tsx`**

Open the file. Find the `NAV_ITEMS` array. Remove the entire object for `"Invites"` (the entry with `href: "/admin/invites"`). The array goes from 6 items to 5.

**Step 3: Run typecheck and lint**

```bash
bun run typecheck && bun run lint
```

Expected: No errors.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(admin): remove invites panel and nav item from admin console"
```

---

### Task 14: Update geminiStream.ts to accept apiKey param

**Files:**
- Modify: `src/infra/ai/geminiStream.ts`

**Step 1: Update the input type and the function**

Open `src/infra/ai/geminiStream.ts`. Change `GeminiStreamInput` type:

```ts
// Before:
type GeminiStreamInput = {
  messages: NioContextMessage[];
  maxOutputTokens: number;
};

// After:
type GeminiStreamInput = {
  messages: NioContextMessage[];
  maxOutputTokens: number;
  apiKey: string;
};
```

Then update the `streamGemini` function to use the passed key:

```ts
const streamGemini = async (
  input: GeminiStreamInput,
): Promise<NioProviderStreamResult> => {
  const apiKey = input.apiKey;  // ← use passed key instead of process.env

  // Remove these lines:
  // const apiKey = process.env.GEMINI_API_KEY;
  // if (!apiKey) { throw createProviderStreamError("Gemini API key is missing."); }
```

Remove the `if (!apiKey)` guard since the key is now required by the type system.

**Step 2: Run typecheck**

```bash
bun run typecheck
```

Expected: Errors in `route.ts` where `streamGemini` is called without `apiKey`. That's expected — fixed in Task 17.

**Step 3: Commit**

```bash
git add src/infra/ai/geminiStream.ts
git commit -m "feat(ai): update geminiStream to accept apiKey param instead of reading from env"
```

---

### Task 15: Create openaiStream.ts

**Files:**
- Create: `src/infra/ai/openaiStream.ts`

**Step 1: Write the file**

```ts
import type { NioContextMessage } from "../../domain/nioContextBuilder";
import type { NioProviderStreamResult } from "./providerTypes";
import { createProviderStreamError, NioProviderStreamError } from "./providerTypes";

type OpenAIStreamInput = {
  messages: NioContextMessage[];
  maxOutputTokens: number;
  apiKey: string;
};

const OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const toOpenAIRole = (role: string): "system" | "user" | "assistant" => {
  if (role === "system") return "system";
  if (role === "assistant") return "assistant";
  return "user";
};

const streamOpenAI = async (
  input: OpenAIStreamInput,
): Promise<NioProviderStreamResult> => {
  const body = {
    model: OPENAI_MODEL,
    messages: input.messages.map((m) => ({
      role: toOpenAIRole(m.role),
      content: m.content,
    })),
    max_tokens: input.maxOutputTokens,
    stream: true,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  let response: Response;
  try {
    response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    throw createProviderStreamError(
      controller.signal.aborted
        ? "OpenAI request timed out."
        : `OpenAI fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      0,
      "openai",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw createProviderStreamError(
      `OpenAI request failed with status ${response.status}.`,
      response.status,
      "openai",
    );
  }

  if (!response.body) {
    throw new NioProviderStreamError(
      "OpenAI response stream missing.",
      "STREAM_ERROR",
      response.status,
      "openai",
    );
  }

  const responseBody = response.body;

  const stream = (async function* () {
    const reader = responseBody.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const payload = trimmed.slice("data:".length).trim();
        if (payload === "[DONE]") return;

        let parsed: unknown;
        try {
          parsed = JSON.parse(payload);
        } catch {
          continue;
        }

        const token =
          typeof parsed === "object" &&
          parsed !== null &&
          "choices" in parsed &&
          Array.isArray((parsed as { choices: unknown[] }).choices) &&
          (parsed as { choices: { delta?: { content?: string } }[] }).choices[0]
            ?.delta?.content;

        if (typeof token === "string" && token) {
          yield token;
        }
      }
    }
  })();

  return {
    provider: "openai",
    model: OPENAI_MODEL,
    stream,
  };
};

export { streamOpenAI, OPENAI_MODEL };
```

**Step 2: Run typecheck**

```bash
bun run typecheck
```

Expected: No new errors from this file.

**Step 3: Commit**

```bash
git add src/infra/ai/openaiStream.ts
git commit -m "feat(ai): add OpenAI Chat Completions streaming provider"
```

---

### Task 16: Create anthropicStream.ts

**Files:**
- Create: `src/infra/ai/anthropicStream.ts`

**Step 1: Write the file**

```ts
import type { NioContextMessage } from "../../domain/nioContextBuilder";
import type { NioProviderStreamResult } from "./providerTypes";
import { createProviderStreamError, NioProviderStreamError } from "./providerTypes";

type AnthropicStreamInput = {
  messages: NioContextMessage[];
  maxOutputTokens: number;
  apiKey: string;
};

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";

const streamAnthropic = async (
  input: AnthropicStreamInput,
): Promise<NioProviderStreamResult> => {
  const systemMessages = input.messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");

  const conversationMessages = input.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: input.maxOutputTokens,
    ...(systemMessages ? { system: systemMessages } : {}),
    messages: conversationMessages,
    stream: true,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": input.apiKey,
        "anthropic-version": ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    throw createProviderStreamError(
      controller.signal.aborted
        ? "Anthropic request timed out."
        : `Anthropic fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      0,
      "anthropic",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw createProviderStreamError(
      `Anthropic request failed with status ${response.status}.`,
      response.status,
      "anthropic",
    );
  }

  if (!response.body) {
    throw new NioProviderStreamError(
      "Anthropic response stream missing.",
      "STREAM_ERROR",
      response.status,
      "anthropic",
    );
  }

  const responseBody = response.body;

  const stream = (async function* () {
    const reader = responseBody.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const payload = trimmed.slice("data:".length).trim();

        let parsed: unknown;
        try {
          parsed = JSON.parse(payload);
        } catch {
          continue;
        }

        // Anthropic streams content_block_delta events
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          (parsed as { type?: string }).type === "content_block_delta" &&
          typeof (parsed as { delta?: { text?: string } }).delta?.text === "string"
        ) {
          const text = (parsed as { delta: { text: string } }).delta.text;
          if (text) yield text;
        }
      }
    }
  })();

  return {
    provider: "anthropic",
    model: ANTHROPIC_MODEL,
    stream,
  };
};

export { streamAnthropic, ANTHROPIC_MODEL };
```

**Step 2: Run typecheck**

```bash
bun run typecheck
```

Expected: No new errors.

**Step 3: Commit**

```bash
git add src/infra/ai/anthropicStream.ts
git commit -m "feat(ai): add Anthropic Messages API streaming provider"
```

---

### Task 17: Update the API route for BYOK

**Files:**
- Modify: `src/app/api/nio/route.ts`

This is the largest change. The route needs to:
1. Remove the Gemini+Groq server-key logic
2. Call `userApiKeys.resolveForRequest` to get the user's provider + key
3. Emit `NO_API_KEY` SSE event if no key is configured
4. Remove the fallback mechanism (no more Groq fallback)
5. Route to the appropriate streamer based on the resolved provider

**Step 1: Add new imports at the top of route.ts**

Add these after the existing imports:
```ts
import { streamOpenAI } from "../../../infra/ai/openaiStream";
import { streamAnthropic } from "../../../infra/ai/anthropicStream";
```

**Step 2: Remove the old `streamWithProviders` function**

Delete the entire `streamWithProviders` function (from its definition to the closing `};`). This removes the Gemini/Groq fallback logic.

**Step 3: Add a new `streamWithByok` function**

Replace it with:

```ts
const streamWithByok = async (args: {
  requestId: string;
  assistantTempId: string;
  contextHash: string;
  inputChars: number;
  budget: {
    maxOutputTokens: number;
    maxContextTokens: number;
    approxCharBudget: number;
  };
  threadId: string;
  lessonId: string;
  videoTimeSec: number;
  timeWindow: { startSec: number; endSec: number };
  codeHash?: string;
  messages: NioContextMessage[];
  client: ConvexHttpClient;
  enqueue: (event: NioSseEvent) => void;
  isAborted: () => boolean;
}): Promise<void> => {
  const startedAtMs = Date.now();

  const emitError = (code: NioErrorCode, message: string): void => {
    args.enqueue({
      type: "error",
      requestId: args.requestId,
      assistantTempId: args.assistantTempId,
      seq: 1,
      code,
      message,
    });
  };

  // Resolve user's API key from Convex
  let resolved: { provider: NioProviderId; key: string } | null = null;
  try {
    resolved = await args.client.action(api.userApiKeys.resolveForRequest, {});
  } catch (err) {
    console.error("[nio] resolveForRequest failed", err);
    emitError("STREAM_ERROR", "Failed to resolve API key.");
    return;
  }

  if (!resolved) {
    emitError("NO_API_KEY", "No API key configured. Add one in Settings.");
    return;
  }

  const { provider, key } = resolved;

  let providerResult: NioProviderStreamResult;
  try {
    if (provider === "gemini") {
      providerResult = await streamGemini({
        messages: args.messages,
        maxOutputTokens: args.budget.maxOutputTokens,
        apiKey: key,
      });
    } else if (provider === "openai") {
      providerResult = await streamOpenAI({
        messages: args.messages,
        maxOutputTokens: args.budget.maxOutputTokens,
        apiKey: key,
      });
    } else if (provider === "anthropic") {
      providerResult = await streamAnthropic({
        messages: args.messages,
        maxOutputTokens: args.budget.maxOutputTokens,
        apiKey: key,
      });
    } else {
      emitError("STREAM_ERROR", "Unknown provider.");
      return;
    }
  } catch (error) {
    const providerError = normalizeProviderError(error, provider);
    args.enqueue({
      type: "error",
      requestId: args.requestId,
      assistantTempId: args.assistantTempId,
      seq: 1,
      code: providerError.code,
      message: providerError.message,
      provider: providerError.provider ?? provider,
    });
    return;
  }

  const iterator = providerResult.stream[Symbol.asyncIterator]();

  const timeToFirstTokenMs = Date.now() - startedAtMs;

  args.enqueue({
    type: "meta",
    requestId: args.requestId,
    assistantTempId: args.assistantTempId,
    provider: providerResult.provider,
    model: providerResult.model,
    startedAtMs,
    contextHash: args.contextHash,
    budget: args.budget,
    seq: 0,
  });

  let fullText = "";
  let seq = 1;

  try {
    while (true) {
      const { value, done } = await iterator.next();
      if (done) break;
      if (args.isAborted()) return;
      if (!value) continue;

      fullText += value;
      args.enqueue({
        type: "token",
        requestId: args.requestId,
        assistantTempId: args.assistantTempId,
        seq,
        token: value,
      });
      seq += 1;
    }
  } catch (error) {
    const providerError = normalizeProviderError(error, providerResult.provider);
    args.enqueue({
      type: "error",
      requestId: args.requestId,
      assistantTempId: args.assistantTempId,
      seq,
      code: providerError.code,
      message: providerError.message,
      provider: providerError.provider ?? providerResult.provider,
    });
    return;
  }

  const latencyMs = Date.now() - startedAtMs;
  args.enqueue({
    type: "done",
    requestId: args.requestId,
    assistantTempId: args.assistantTempId,
    seq,
    provider: providerResult.provider,
    model: providerResult.model,
    usedFallback: false,
    latencyMs,
    timeToFirstTokenMs,
    usageApprox: {
      inputChars: args.inputChars,
      outputChars: fullText.length,
    },
    finalText: fullText,
  });

  void persistAssistantMessage({
    threadId: args.threadId,
    requestId: args.requestId,
    content: fullText,
    videoTimeSec: args.videoTimeSec,
    timeWindow: args.timeWindow,
    codeHash: args.codeHash,
    provider: providerResult.provider,
    model: providerResult.model,
    latencyMs,
    usedFallback: false,
    contextHash: args.contextHash,
    client: args.client,
  }).catch((error) => {
    console.error("[nio] assistant persistence failed", error);
  });
};
```

**Step 4: Update the `POST` handler's `run` function**

In the `run()` call inside the `ReadableStream` start, replace `streamWithProviders(...)` with `streamWithByok(...)` and update the args (remove `lessonId` if `streamWithProviders` had it, match the new signature).

**Step 5: Remove unused imports and helpers**

Remove imports for `streamGroq`, `AI_FALLBACK_TIMEOUT_MS`, `shouldFallbackBeforeFirstToken`, `logAiFallbackEvent` — these are no longer used. TypeScript will flag them.

Also remove the unused `readFirstToken`, `shouldFallbackForFirstToken`, `resolveFallbackReason` helper functions.

**Step 6: Add `NO_API_KEY` to the NioErrorCode check**

In `src/infra/ai/nioSse.ts` (or wherever SSE events are encoded), ensure `NO_API_KEY` is a valid code. Since you added it to `NioErrorCode` in Task 7, this should already work.

**Step 7: Run typecheck**

```bash
bun run typecheck
```

Expected: Clean. Fix any remaining type errors.

**Step 8: Commit**

```bash
git add src/app/api/nio/route.ts src/infra/ai/
git commit -m "feat(api): replace server-key AI with BYOK resolution via Convex, add NO_API_KEY error"
```

---

### Task 18: Create ApiKeySettings.tsx

**Files:**
- Create: `src/ui/settings/ApiKeySettings.tsx`

**Step 1: Create directory**

```bash
mkdir -p src/ui/settings
```

**Step 2: Write the component**

```tsx
"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, type ReactElement } from "react";

type Provider = "gemini" | "openai" | "anthropic";

const PROVIDER_LABELS: Record<Provider, string> = {
  gemini: "Google Gemini",
  openai: "OpenAI",
  anthropic: "Anthropic",
};

const PROVIDER_PLACEHOLDER: Record<Provider, string> = {
  gemini: "AIza...",
  openai: "sk-proj-...",
  anthropic: "sk-ant-...",
};

type ProviderRowProps = {
  provider: Provider;
  keyHint: string | null;
  isActive: boolean;
  onSetActive: () => void;
};

const ProviderRow = ({
  provider,
  keyHint,
  isActive,
  onSetActive,
}: ProviderRowProps): ReactElement => {
  const saveKey = useAction(api.userApiKeys.save);
  const removeKey = useMutation(api.userApiKeys.remove);

  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (): Promise<void> => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setSaving(true);
    setError(null);
    try {
      await saveKey({ provider, key: trimmed });
      setEditing(false);
      setInputValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save key.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (): Promise<void> => {
    await removeKey({ provider });
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter") void handleSave();
    if (e.key === "Escape") {
      setEditing(false);
      setInputValue("");
      setError(null);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {keyHint && (
            <button
              type="button"
              onClick={onSetActive}
              disabled={isActive}
              className={`h-3 w-3 rounded-full border-2 transition ${
                isActive
                  ? "border-accent bg-accent"
                  : "border-border bg-transparent hover:border-accent/60"
              }`}
              aria-label={isActive ? "Active provider" : `Switch to ${PROVIDER_LABELS[provider]}`}
            />
          )}
          <span className="text-sm font-medium text-foreground">
            {PROVIDER_LABELS[provider]}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {keyHint ? (
            <>
              <span className="font-mono text-xs text-text-subtle">
                ••••{keyHint}
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setInputValue("");
                }}
                className="rounded px-1.5 py-0.5 text-xs text-text-muted hover:bg-surface-muted hover:text-foreground transition"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void handleRemove()}
                className="rounded px-1.5 py-0.5 text-xs text-text-muted hover:bg-surface-muted hover:text-red-500 transition"
              >
                Remove
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded px-1.5 py-0.5 text-xs text-text-muted hover:bg-surface-muted hover:text-foreground transition"
            >
              Add key
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="flex flex-col gap-1">
          <div className="flex gap-1.5">
            <input
              type="password"
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={PROVIDER_PLACEHOLDER[provider]}
              className="flex-1 rounded border border-border bg-background px-2 py-1 font-mono text-xs text-foreground outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
            />
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !inputValue.trim()}
              className="rounded bg-accent px-2 py-1 text-xs font-medium text-white disabled:opacity-50 hover:opacity-90 transition"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setInputValue("");
                setError(null);
              }}
              className="rounded px-2 py-1 text-xs text-text-muted hover:bg-surface-muted transition"
            >
              Cancel
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      )}
    </div>
  );
};

const ApiKeySettings = (): ReactElement => {
  const hints = useQuery(api.userApiKeys.listHints);
  const setActiveProvider = useMutation(api.userApiKeys.setActiveProvider);

  const providers: Provider[] = ["gemini", "openai", "anthropic"];

  const getHint = (provider: Provider): string | null =>
    hints?.find((h) => h.provider === provider)?.keyHint ?? null;

  const isActive = (provider: Provider): boolean =>
    hints?.find((h) => h.provider === provider)?.isActive ?? false;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
        Nio AI Provider
      </p>
      <div className="flex flex-col gap-1.5">
        {providers.map((provider) => (
          <ProviderRow
            key={provider}
            provider={provider}
            keyHint={getHint(provider)}
            isActive={isActive(provider)}
            onSetActive={() => {
              void setActiveProvider({ provider });
            }}
          />
        ))}
      </div>
      <p className="text-xs text-text-subtle leading-relaxed">
        Keys are encrypted and stored securely. Your key is never shown after saving.
        <br />
        Get a free Gemini key at{" "}
        <a
          href="https://aistudio.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline-offset-2 hover:underline"
        >
          aistudio.google.com
        </a>
        .
      </p>
    </div>
  );
};

export { ApiKeySettings };
```

**Step 3: Run typecheck**

```bash
bun run typecheck
```

Expected: Clean.

**Step 4: Commit**

```bash
git add src/ui/settings/ApiKeySettings.tsx
git commit -m "feat(ui): add ApiKeySettings component for multi-provider BYOK key management"
```

---

### Task 19: Integrate ApiKeySettings into ControlCenterDrawer

**Files:**
- Modify: `src/ui/shell/ControlCenterDrawer.tsx`

**Step 1: Import the component**

Add at the top of the file (with other imports):

```ts
import { ApiKeySettings } from "../settings/ApiKeySettings";
```

**Step 2: Add the Nio section to the drawer**

Find the settings panel section in the component (where `ThemeToggle` and layout presets live). Add the `<ApiKeySettings />` block above the layout section:

```tsx
{/* Nio AI settings */}
<section className="flex flex-col gap-2 border-b border-border pb-4">
  <ApiKeySettings />
</section>
```

**Step 3: Run typecheck and lint**

```bash
bun run typecheck && bun run lint
```

Expected: Clean.

**Step 4: Commit**

```bash
git add src/ui/shell/ControlCenterDrawer.tsx
git commit -m "feat(ui): integrate ApiKeySettings into workspace control center"
```

---

### Task 20: Handle NO_API_KEY in the chat pane

**Files:**
- Modify: `src/ui/chat/ChatComposer.tsx` (or the chat pane parent that renders it)

**Step 1: Identify where the chat input renders**

Open `src/ui/chat/ChatComposer.tsx`. The component has a `disabled` prop. Find the parent component that renders `<ChatComposer />` — likely `src/ui/panes/ChatPane.tsx` or similar. Check `src/ui/panes/`.

**Step 2: Handle the NO_API_KEY SSE error in the chat state**

In the component or hook that processes SSE events, handle the `NO_API_KEY` code specifically. When received, set a `noApiKey` state flag.

**Step 3: Add the gate UI**

In the component that renders `<ChatComposer />`, wrap it with a check:

```tsx
{noApiKey ? (
  <div className="flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-3">
    <p className="text-sm text-text-subtle">
      Add an API key in{" "}
      <button
        type="button"
        onClick={onOpenSettings}
        className="text-accent underline-offset-2 hover:underline"
      >
        Settings
      </button>{" "}
      to chat with Nio.
    </p>
  </div>
) : (
  <ChatComposer onSend={handleSend} disabled={isStreaming} />
)}
```

You'll need to wire `onOpenSettings` to open the ControlCenterDrawer — check how the drawer is currently triggered in the workspace layout.

**Step 4: Run typecheck and lint**

```bash
bun run typecheck && bun run lint
```

**Step 5: Commit**

```bash
git add src/ui/chat/ src/ui/panes/
git commit -m "feat(chat): show API key prompt when NO_API_KEY error received from Nio"
```

---

### Task 21: Update docs/env-requirements.md

**Files:**
- Modify: `docs/env-requirements.md`

**Step 1: Make three edits:**

1. **Add the new variable** in the "Core runtime variables" section:
   ```
   - `NIOTEBOOK_KEY_ENCRYPTION_SECRET` - Required for BYOK AI key encryption. 32-byte random value. Generate with `openssl rand -base64 32`. Must be set in both Vercel env vars AND Convex dashboard env vars.
   ```

2. **Mark Gemini and Groq as no longer required** (in the "Core runtime variables" section):
   ```
   - `GEMINI_API_KEY` - No longer required in production. Users supply their own key via the settings panel. May still be set for local dev testing.
   - `GROQ_API_KEY` - No longer required. Groq fallback removed in BYOK model.
   ```

3. **Remove the "Invite tracking" section** at the bottom (the alpha invite system is gone).

**Step 2: No test needed.**

**Step 3: Commit**

```bash
git add docs/env-requirements.md
git commit -m "docs: update env requirements for BYOK model (add encryption secret, mark AI keys optional)"
```

---

### Task 22: Final verification

**Step 1: Run the full check suite**

```bash
bun run typecheck && bun run lint && bun run test && bun run build
```

Expected: All pass. Fix anything that fails before declaring done.

**Step 2: Verify no `any` in convex/**

```bash
bun run check:any
```

Expected: exits 0 (no matches found).

**Step 3: Verify no `unknown` in src/domain/**

```bash
bun run check:unknown
```

Expected: exits 0.

**Step 4: Manual Clerk dashboard check (one-time)**

In the Clerk dashboard for your app:
- Navigate to "User & Authentication" → "Email, Phone, Username"
- Ensure "Email address" is enabled and public sign-up is allowed (not invite-only)
- Remove any invite-only restriction that was set during alpha

**Step 5: Commit if any cleanup was needed**

```bash
git add -A
git commit -m "chore: final verification cleanup"
```

---

### Task 23: Create PR

**Step 1: Push the branch**

```bash
git push -u origin feat/open-access-byok
```

**Step 2: Create a PR**

Title: `feat: open public access and add BYOK multi-provider AI (Gemini, OpenAI, Anthropic)`

Body:
```
## Summary

- Removes invite-only gate — anyone can sign up via Clerk email OTP
- Adds BYOK AI key management: users bring their own Gemini, OpenAI, or Anthropic key
- Keys stored AES-256-GCM encrypted in Convex, never returned to client after saving
- New settings panel in workspace control center for key management + provider switching
- Removes Groq fallback (no longer needed — user's chosen provider is used directly)
- Retires admin invites panel; analytics, users, and feedback panels unchanged

## Closes

- OSS transition design: docs/plans/2026-03-07-oss-transition-design.md

## Test plan

- [ ] New user can sign up without an invite and reach the workspace
- [ ] API key settings panel appears in control center for all three providers
- [ ] Adding a Gemini key auto-selects it as active
- [ ] Switching active provider changes which streamer is used on next message
- [ ] Removing the active provider clears Nio and shows the inline gate prompt
- [ ] Editing a key overwrites the old one (hint updates)
- [ ] `bun run typecheck && bun run lint && bun run test && bun run build` all pass
```

---

## Done

Track 1 published the repo. Track 2 ships open access + BYOK Nio.

**Success criteria from the design doc:**
- [ ] Repository is public with LICENSE, README, CONTRIBUTING, .env.example
- [ ] New users can sign up without an invite
- [ ] BYOK works for Gemini, OpenAI, Anthropic with per-user encrypted storage
- [ ] Users without a key see the inline settings prompt, not a broken input
- [ ] Admin console has no invites panel
- [ ] `bun run typecheck && bun run lint && bun run test` all pass
