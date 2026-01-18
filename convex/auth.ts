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

const requireMutationUser = async (
  ctx: MutationCtx,
): Promise<AuthenticatedUser> => {
  return requireUser(ctx);
};

const requireMutationAdmin = async (
  ctx: MutationCtx,
): Promise<AuthenticatedUser> => {
  return requireAdmin(ctx);
};

const requireQueryUser = async (ctx: QueryCtx): Promise<AuthenticatedUser> => {
  return requireUser(ctx);
};

const requireQueryWorkspaceUser = async (
  ctx: QueryCtx,
): Promise<AuthenticatedUser> => {
  return requireUser(ctx);
};

const requireQueryAdmin = async (ctx: QueryCtx): Promise<AuthenticatedUser> => {
  return requireAdmin(ctx);
};

export type { AuthenticatedUser };
export {
  requireMutationAdmin,
  requireMutationUser,
  requireQueryAdmin,
  requireQueryUser,
  requireQueryWorkspaceUser,
};
