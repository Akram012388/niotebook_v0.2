import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import type { GenericId } from "convex/values";
import type { DataModel } from "./_generated/dataModel";
import type { UserId } from "../src/domain/ids";
import { toDomainId } from "./idUtils";

type AuthenticatedUser = {
  id: UserId;
  role: "admin" | "user" | "guest";
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

  if (user.role === "guest") {
    throw new Error("Guest access denied.");
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

  if (
    process.env.NODE_ENV === "production" &&
    devBypass === "true" &&
    !allowPreviewBypass
  ) {
    throw new Error("NIOTEBOOK_DEV_AUTH_BYPASS is not allowed in production.");
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

  if (
    process.env.NODE_ENV === "production" &&
    devBypass === "true" &&
    !allowPreviewBypass
  ) {
    throw new Error("NIOTEBOOK_DEV_AUTH_BYPASS is not allowed in production.");
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
    inviteBatchId: "dev-bypass",
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

const requireQueryWorkspaceUser = async (
  ctx: QueryCtx,
): Promise<AuthenticatedUser> => {
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
  requireQueryWorkspaceUser,
};
