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
  handler: async (ctx): Promise<{ userId: string; role: "admin" | "user" }> => {
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
  handler: async (ctx): Promise<{ role: "admin" | "user" } | null> => {
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
