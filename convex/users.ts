import { v } from "convex/values";
import type { GenericId } from "convex/values";
import { mutation } from "./_generated/server";
import { toDomainId } from "./idUtils";

type UserRecord = {
  _id: GenericId<"users">;
  tokenIdentifier: string;
  email?: string;
  role: "admin" | "user" | "guest";
  inviteBatchId?: string;
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
  args: {
    inviteBatchId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
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

    const inviteBatchId = args.inviteBatchId ?? existing?.inviteBatchId;

    if (existing) {
      await ctx.db.patch(existing._id, {
        email,
        role,
        inviteBatchId,
      });

      return { userId: toDomainId(existing._id), role };
    }

    const userId = await ctx.db.insert("users", {
      tokenIdentifier,
      email,
      role,
      inviteBatchId,
    });

    return { userId: toDomainId(userId as GenericId<"users">), role };
  },
});

export { upsertUser };
