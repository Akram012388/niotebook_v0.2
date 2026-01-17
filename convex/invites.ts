import { mutation, query } from "./_generated/server";
import type { IndexRangeBuilder } from "convex/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import {
  buildInviteError,
  buildInviteSummary,
  resolveInviteRedeem,
  toInviteSummary,
  type InviteRecord,
  type InviteRedeemResult,
  type InviteRole,
  type InviteSummary,
  type InviteUpsertResult,
} from "../src/domain/invites";
import {
  INVITE_REDEEM_LIMIT,
  INVITE_REDEEM_WINDOW_MS,
} from "../src/domain/rate-limits";
import { consumeRateLimit } from "./rateLimits";
import {
  requireMutationAdmin,
  requireMutationUser,
  requireQueryAdmin,
} from "./auth";
import { toDomainId, toGenericId } from "./idUtils";

type InviteIndexFields = ["code"];

const getInviteByCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args): Promise<InviteSummary | null> => {
    await requireQueryAdmin(ctx);

    const invite = (await ctx.db
      .query("invites")
      .withIndex("by_code", (query) => {
        const typedQuery = query as unknown as IndexRangeBuilder<
          InviteRecord,
          InviteIndexFields
        >;

        return typedQuery.eq("code", args.code);
      })
      .first()) as InviteRecord | null;

    return invite ? toInviteSummary(invite) : null;
  },
});

const upsertInvite = mutation({
  args: {
    code: v.string(),
    inviteBatchId: v.string(),
    role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
  },
  handler: async (ctx, args): Promise<InviteUpsertResult> => {
    await requireMutationAdmin(ctx);

    const invite = (await ctx.db
      .query("invites")
      .withIndex("by_code", (query) => {
        const typedQuery = query as unknown as IndexRangeBuilder<
          InviteRecord,
          InviteIndexFields
        >;

        return typedQuery.eq("code", args.code);
      })
      .first()) as InviteRecord | null;

    if (invite?.usedAt) {
      return {
        ok: false,
        error: buildInviteError("INVITE_ALREADY_USED"),
      };
    }

    const role: InviteRole = args.role ?? "user";

    if (invite) {
      await ctx.db.patch(invite._id, {
        inviteBatchId: args.inviteBatchId,
        role,
      });

      return {
        ok: true,
        value: {
          ...toInviteSummary(invite),
          inviteBatchId: args.inviteBatchId,
          role,
        },
      };
    }

    const createdAt = Date.now();
    const inviteId = await ctx.db.insert("invites", {
      code: args.code,
      createdAt,
      inviteBatchId: args.inviteBatchId,
      role,
    });

    return {
      ok: true,
      value: buildInviteSummary(
        toDomainId(inviteId as GenericId<"invites">),
        { code: args.code, inviteBatchId: args.inviteBatchId, role },
        createdAt,
      ),
    };
  },
});

const redeemInvite = mutation({
  args: {
    code: v.string(),
    ip: v.string(),
  },
  handler: async (ctx, args): Promise<InviteRedeemResult> => {
    const user = await requireMutationUser(ctx);
    const limitDecision = await consumeRateLimit(
      ctx,
      "invite_redeem",
      args.ip,
      INVITE_REDEEM_WINDOW_MS,
      INVITE_REDEEM_LIMIT,
    );

    if (!limitDecision.ok) {
      return {
        ok: false,
        error: buildInviteError("RATE_LIMITED"),
      };
    }

    const invite = (await ctx.db
      .query("invites")
      .withIndex("by_code", (query) => {
        const typedQuery = query as unknown as IndexRangeBuilder<
          InviteRecord,
          InviteIndexFields
        >;

        return typedQuery.eq("code", args.code);
      })
      .first()) as InviteRecord | null;

    if (!invite) {
      return {
        ok: false,
        error: buildInviteError("INVITE_NOT_FOUND"),
      };
    }

    const nowMs = Date.now();
    const summary = toInviteSummary(invite);
    const redemption = resolveInviteRedeem(
      summary,
      toDomainId(user.id as GenericId<"users">),
      nowMs,
    );

    if (!redemption.ok) {
      return redemption;
    }

    const usedAt = redemption.value.usedAt ?? nowMs;

    await ctx.db.patch(invite._id, {
      usedAt,
      usedByUserId: toGenericId(user.id),
    });

    return redemption;
  },
});

export { getInviteByCode, redeemInvite, upsertInvite };
