import { v } from "convex/values";
import type { GenericId } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { encryptApiKey, decryptApiKey } from "./lib/crypto";

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
      throw new Error("NIOTEBOOK_KEY_ENCRYPTION_SECRET is not configured");
    }

    const keyHint = trimmedKey.slice(-4);
    const { encryptedKey, iv } = await encryptApiKey(trimmedKey, secret);

    const user = await ctx.runQuery(internal.userApiKeys._getUserByToken, {
      tokenIdentifier: identity.tokenIdentifier,
    });
    if (!user) {
      throw new Error("User record not found.");
    }

    const existingKeys = await ctx.runQuery(
      internal.userApiKeys._getKeysByUser,
      {
        tokenIdentifier: identity.tokenIdentifier,
      },
    );
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
      throw new Error("NIOTEBOOK_KEY_ENCRYPTION_SECRET is not configured");
    }

    const activeKey = await ctx.runQuery(internal.userApiKeys._getActiveKey, {
      tokenIdentifier: identity.tokenIdentifier,
    });

    if (!activeKey) {
      return null;
    }

    const key = await decryptApiKey(
      activeKey.encryptedKey,
      activeKey.iv,
      secret,
    );

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
