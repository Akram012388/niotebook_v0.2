import { mutationGeneric, queryGeneric, type IndexRangeBuilder } from "convex/server";
import { v } from "convex/values";
import {
  buildInviteError,
  buildInviteSummary,
  resolveInviteRedeem,
  toInviteSummary,
  type InviteRecord,
  type InviteRedeemResult,
  type InviteRole,
  type InviteSummary,
  type InviteUpsertResult
} from "../src/domain/invites";
import {
  INVITE_REDEEM_LIMIT,
  INVITE_REDEEM_WINDOW_MS
} from "../src/domain/rate-limits";
import { consumeRateLimit } from "./rateLimits";

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
    userId: v.id("users"),
    ip: v.string()
  },
  handler: async (ctx, args): Promise<InviteRedeemResult> => {
    const limitDecision = await consumeRateLimit(
      ctx,
      "invite_redeem",
      args.ip,
      INVITE_REDEEM_WINDOW_MS,
      INVITE_REDEEM_LIMIT
    );

    if (!limitDecision.ok) {
      return {
        ok: false,
        error: buildInviteError("RATE_LIMITED", "Invite redemption rate limited.")
      };
    }

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

    const nowMs = Date.now();
    const summary = toInviteSummary(invite);
    const redemption = resolveInviteRedeem(summary, args.userId, nowMs);

    if (!redemption.ok) {
      return redemption;
    }

    const usedAt = redemption.value.usedAt ?? nowMs;

    await ctx.db.patch(invite._id, {
      usedAt,
      usedByUserId: args.userId
    });

    return redemption;
  }
});

export { getInviteByCode, redeemInvite, upsertInvite };
