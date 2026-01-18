import { mutation, query } from "./_generated/server";
import type { IndexRangeBuilder } from "convex/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import {
  buildInviteError,
  buildInviteSummary,
  resolveInviteRedeem,
  resolveInviteStatus,
  toInviteSummary,
  INVITE_TTL_MS,
  type InviteRedeemResult,
  type InviteRecord,
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
    const admin = await requireMutationAdmin(ctx);

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
    const nowMs = Date.now();

    if (invite) {
      const expiresAt = invite.expiresAt ?? invite.createdAt + INVITE_TTL_MS;
      const summary = {
        ...toInviteSummary(invite),
        expiresAt,
      };
      const status = resolveInviteStatus(summary, nowMs);

      await ctx.db.patch(invite._id, {
        inviteBatchId: args.inviteBatchId,
        role,
        expiresAt,
        status,
      });

      return {
        ok: true,
        value: {
          ...summary,
          inviteBatchId: args.inviteBatchId,
          role,
          status,
        },
      };
    }

    const createdAt = nowMs;
    const expiresAt = createdAt + INVITE_TTL_MS;
    const inviteId = await ctx.db.insert("invites", {
      code: args.code,
      createdAt,
      createdByUserId: toGenericId(admin.id),
      expiresAt,
      status: "active",
      inviteBatchId: args.inviteBatchId,
      role,
    });

    return {
      ok: true,
      value: buildInviteSummary(
        toDomainId(inviteId as GenericId<"invites">),
        { code: args.code, inviteBatchId: args.inviteBatchId, role },
        createdAt,
        toDomainId(admin.id as GenericId<"users">),
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
    const expiresAt = invite.expiresAt ?? invite.createdAt + INVITE_TTL_MS;
    const summary = {
      ...toInviteSummary(invite),
      expiresAt,
    };
    const status = resolveInviteStatus(summary, nowMs);
    const redemption = resolveInviteRedeem(
      summary,
      toDomainId(user.id as GenericId<"users">),
      nowMs,
    );

    if (!redemption.ok) {
      if (status === "expired" && invite.status !== "expired") {
        await ctx.db.patch(invite._id, {
          status: "expired",
        });
      }

      return redemption;
    }

    const usedAt = redemption.value.usedAt ?? nowMs;

    await ctx.db.patch(invite._id, {
      status: "used",
      usedAt,
      usedByUserId: toGenericId(user.id),
    });

    return redemption;
  },
});

export { getInviteByCode, redeemInvite, upsertInvite };
