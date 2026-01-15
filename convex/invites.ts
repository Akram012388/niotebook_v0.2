import { mutationGeneric, queryGeneric, type IndexRangeBuilder } from "convex/server";
import { v } from "convex/values";
import {
  buildInviteError,
  buildInviteSummary,
  buildInviteUsedSummary,
  toInviteSummary,
  type InviteRecord,
  type InviteRedeemResult,
  type InviteRole,
  type InviteSummary,
  type InviteUpsertResult
} from "../src/domain/invites";

type InviteIndexFields = ["code"];

const getInviteByCode = queryGeneric({
  args: {
    code: v.string()
  },
  handler: async (ctx, args): Promise<InviteSummary | null> => {
    const invite = (await ctx.db
      .query("invites")
      .withIndex("by_code", (query) => {
        const typedQuery = query as IndexRangeBuilder<InviteRecord, InviteIndexFields>;

        return typedQuery.eq("code", args.code);
      })
      .first()) as InviteRecord | null;

    return invite ? toInviteSummary(invite) : null;
  }
});

const upsertInvite = mutationGeneric({
  args: {
    code: v.string(),
    inviteBatchId: v.string(),
    role: v.optional(v.union(v.literal("user"), v.literal("admin")))
  },
  handler: async (ctx, args): Promise<InviteUpsertResult> => {
    const invite = (await ctx.db
      .query("invites")
      .withIndex("by_code", (query) => {
        const typedQuery = query as IndexRangeBuilder<InviteRecord, InviteIndexFields>;

        return typedQuery.eq("code", args.code);
      })
      .first()) as InviteRecord | null;

    if (invite?.usedAt) {
      return {
        ok: false,
        error: buildInviteError("invite_already_used", "Invite already used.")
      };
    }

    const role: InviteRole = args.role ?? "user";

    if (invite) {
      await ctx.db.patch(invite._id, {
        inviteBatchId: args.inviteBatchId,
        role
      });

      return {
        ok: true,
        value: {
          ...toInviteSummary(invite),
          inviteBatchId: args.inviteBatchId,
          role
        }
      };
    }

    const createdAt = Date.now();
    const inviteId = await ctx.db.insert("invites", {
      code: args.code,
      createdAt,
      inviteBatchId: args.inviteBatchId,
      role
    });

    return {
      ok: true,
      value: buildInviteSummary(inviteId, { code: args.code, inviteBatchId: args.inviteBatchId, role }, createdAt)
    };
  }
});

const redeemInvite = mutationGeneric({
  args: {
    code: v.string(),
    userId: v.id("users")
  },
  handler: async (ctx, args): Promise<InviteRedeemResult> => {
    const invite = (await ctx.db
      .query("invites")
      .withIndex("by_code", (query) => {
        const typedQuery = query as IndexRangeBuilder<InviteRecord, InviteIndexFields>;

        return typedQuery.eq("code", args.code);
      })
      .first()) as InviteRecord | null;

    if (!invite) {
      return {
        ok: false,
        error: buildInviteError("invite_not_found", "Invite not found.")
      };
    }

    if (invite.usedAt) {
      return {
        ok: false,
        error: buildInviteError("invite_already_used", "Invite already used.")
      };
    }

    const usedAt = Date.now();

    await ctx.db.patch(invite._id, {
      usedAt,
      usedByUserId: args.userId
    });

    return {
      ok: true,
      value: buildInviteUsedSummary(toInviteSummary(invite), args.userId, usedAt)
    };
  }
});

export { getInviteByCode, redeemInvite, upsertInvite };
