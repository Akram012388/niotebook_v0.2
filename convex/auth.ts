import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import type { GenericId } from "convex/values";
import type { DataModel } from "./_generated/dataModel";
import type { UserId } from "../src/domain/ids";
import { toDomainId } from "./idUtils";

type AuthenticatedUser = {
  id: UserId;
  role: "admin" | "user";
};

type QueryCtx = GenericQueryCtx<DataModel>;

type MutationCtx = GenericMutationCtx<DataModel>;

type AuthContext = {
  auth: QueryCtx["auth"];
  db: QueryCtx["db"];
};

type MutationAuthContext = {
  auth: MutationCtx["auth"];
  db: MutationCtx["db"];
};

const resolveIdentity = async (
  ctx: AuthContext,
): Promise<AuthenticatedUser | null> => {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (query) =>
      query.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .first();

  if (!user) {
    console.error("[auth] Auth failure: no matching user for token");
    return null;
  }

  return {
    id: toDomainId(user._id as GenericId<"users">),
    role: user.role,
  };
};

const requireUser = async (ctx: AuthContext): Promise<AuthenticatedUser> => {
  const user = await resolveIdentity(ctx);

  if (!user) {
    throw new Error("Not authenticated.");
  }

  return user;
};

const requireAdmin = async (ctx: AuthContext): Promise<AuthenticatedUser> => {
  const user = await requireUser(ctx);

  if (user.role !== "admin") {
    throw new Error("Admin access required.");
  }

  return user;
};

const resolveDevBypass = async (
  ctx: AuthContext,
): Promise<AuthenticatedUser | null> => {
  const devBypass = process.env.NIOTEBOOK_DEV_AUTH_BYPASS;
  const allowPreviewBypass = process.env.NIOTEBOOK_E2E_PREVIEW === "true";
  const allowDevBypassInDev =
    process.env.NIOTEBOOK_ALLOW_DEV_BYPASS_IN_DEV === "true";
  const allowBypass = allowPreviewBypass || allowDevBypassInDev;

  if (devBypass === "true" && !allowBypass) {
    throw new Error(
      "NIOTEBOOK_DEV_AUTH_BYPASS requires preview or local dev override.",
    );
  }

  if (devBypass !== "true") {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (query) =>
      query.eq("tokenIdentifier", "dev-bypass"),
    )
    .first();

  if (!user) {
    if (!allowBypass) {
      throw new Error("Dev bypass user missing in production.");
    }

    return null;
  }

  return {
    id: toDomainId(user._id as GenericId<"users">),
    role: user.role,
  };
};

const ensureDevBypassUser = async (
  ctx: MutationAuthContext,
): Promise<AuthenticatedUser | null> => {
  const devBypass = process.env.NIOTEBOOK_DEV_AUTH_BYPASS;
  const allowPreviewBypass = process.env.NIOTEBOOK_E2E_PREVIEW === "true";
  const allowDevBypassInDev =
    process.env.NIOTEBOOK_ALLOW_DEV_BYPASS_IN_DEV === "true";
  const allowBypass = allowPreviewBypass || allowDevBypassInDev;

  if (devBypass === "true" && !allowBypass) {
    throw new Error(
      "NIOTEBOOK_DEV_AUTH_BYPASS requires preview or local dev override.",
    );
  }

  if (devBypass !== "true") {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (query) =>
      query.eq("tokenIdentifier", "dev-bypass"),
    )
    .first();

  if (user) {
    return {
      id: toDomainId(user._id as GenericId<"users">),
      role: user.role,
    };
  }

  const userId = await ctx.db.insert("users", {
    tokenIdentifier: "dev-bypass",
    email: "dev@niotebook.local",
    role: "admin",
  });

  return {
    id: toDomainId(userId as GenericId<"users">),
    role: "admin",
  };
};

const requireMutationUser = async (
  ctx: MutationCtx,
): Promise<AuthenticatedUser> => {
  const devUser = await ensureDevBypassUser(ctx);
  return devUser ?? requireUser(ctx);
};

const requireMutationAdmin = async (
  ctx: MutationCtx,
): Promise<AuthenticatedUser> => {
  const devUser = await ensureDevBypassUser(ctx);
  return devUser ?? requireAdmin(ctx);
};

const requireQueryUser = async (ctx: QueryCtx): Promise<AuthenticatedUser> => {
  const devUser = await resolveDevBypass(ctx);
  return devUser ?? requireUser(ctx);
};

const requireQueryAdmin = async (ctx: QueryCtx): Promise<AuthenticatedUser> => {
  const devUser = await resolveDevBypass(ctx);
  return devUser ?? requireAdmin(ctx);
};

export type { AuthenticatedUser };
export {
  requireMutationAdmin,
  requireMutationUser,
  requireQueryAdmin,
  requireQueryUser,
};
