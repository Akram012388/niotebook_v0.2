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

const listAll = query({
  args: {
    status: v.optional(
      v.union(v.literal("active"), v.literal("used"), v.literal("expired")),
    ),
  },
  handler: async (
    ctx,
    args,
  ): Promise<
    Array<{
      id: string;
      code: string;
      status: string;
      createdAt: number;
      expiresAt: number;
      usedAt?: number;
      usedByUserId?: string;
      inviteBatchId: string;
      role: string;
    }>
  > => {
    await requireQueryAdmin(ctx);

    const invites = (await ctx.db
      .query("invites")
      .collect()) as InviteRecord[];

    const nowMs = Date.now();

    return invites
      .map((invite) => {
        const summary = toInviteSummary(invite);
        const status = resolveInviteStatus(
          { ...summary, expiresAt: invite.expiresAt ?? invite.createdAt + INVITE_TTL_MS },
          nowMs,
        );
        return {
          id: String(invite._id),
          code: invite.code,
          status,
          createdAt: invite.createdAt,
          expiresAt: invite.expiresAt ?? invite.createdAt + INVITE_TTL_MS,
          usedAt: invite.usedAt,
          usedByUserId: invite.usedByUserId
            ? String(invite.usedByUserId)
            : undefined,
          inviteBatchId: invite.inviteBatchId,
          role: invite.role,
        };
      })
      .filter((invite) => !args.status || invite.status === args.status)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

const generate = mutation({
  args: {
    count: v.number(),
    inviteBatchId: v.string(),
    role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
  },
  handler: async (
    ctx,
    args,
  ): Promise<string[]> => {
    const admin = await requireMutationAdmin(ctx);

    const codes: string[] = [];
    const role: InviteRole = args.role ?? "user";
    const nowMs = Date.now();

    for (let i = 0; i < Math.min(args.count, 50); i++) {
      const code = `${args.inviteBatchId}-${nowMs}-${i}-${Math.random().toString(36).slice(2, 8)}`;
      await ctx.db.insert("invites", {
        code,
        createdAt: nowMs,
        createdByUserId: toGenericId(admin.id),
        expiresAt: nowMs + INVITE_TTL_MS,
        status: "active",
        inviteBatchId: args.inviteBatchId,
        role,
      });
      codes.push(code);
    }

    return codes;
  },
});

const revoke = mutation({
  args: {
    inviteId: v.id("invites"),
  },
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    await requireMutationAdmin(ctx);

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      return { ok: false };
    }

    await ctx.db.patch(args.inviteId, { status: "expired" });
    return { ok: true };
  },
});

export { getInviteByCode, generate, listAll, redeemInvite, revoke, upsertInvite };
