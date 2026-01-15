import type { GenericId } from "convex/values";

type InviteRole = "user" | "admin";

type InviteSummary = {
  id: GenericId<"invites">;
  code: string;
  createdAt: number;
  usedAt?: number;
  usedByUserId?: GenericId<"users">;
  inviteBatchId: string;
  role: InviteRole;
};

type InviteUpsertInput = {
  code: string;
  inviteBatchId: string;
  role: InviteRole;
};

type InviteRedeemInput = {
  inviteId: GenericId<"invites">;
  userId: GenericId<"users">;
};

type InviteErrorCode =
  | "invite_not_found"
  | "invite_already_used"
  | "INVITE_EXPIRED";

type InviteError = {
  code: InviteErrorCode;
  message: string;
};

type InviteResult =
  | { ok: true; value: InviteSummary }
  | { ok: false; error: InviteError };

type InviteRedeemResult = InviteResult;

type InviteUpsertResult = InviteResult;

type InviteRecord = {
  _id: GenericId<"invites">;
  code: string;
  createdAt: number;
  usedAt?: number;
  usedByUserId?: GenericId<"users">;
  inviteBatchId: string;
  role: InviteRole;
};

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const toInviteSummary = (record: InviteRecord): InviteSummary => {
  return {
    id: record._id,
    code: record.code,
    createdAt: record.createdAt,
    usedAt: record.usedAt,
    usedByUserId: record.usedByUserId,
    inviteBatchId: record.inviteBatchId,
    role: record.role
  };
};

const buildInviteSummary = (
  id: GenericId<"invites">,
  input: InviteUpsertInput,
  createdAt: number
): InviteSummary => {
  return {
    id,
    code: input.code,
    createdAt,
    inviteBatchId: input.inviteBatchId,
    role: input.role
  };
};

const buildInviteUsedSummary = (
  invite: InviteSummary,
  userId: GenericId<"users">,
  usedAt: number
): InviteSummary => {
  return {
    ...invite,
    usedAt,
    usedByUserId: userId
  };
};

const buildInviteError = (
  code: InviteErrorCode,
  message: string
): InviteError => {
  return {
    code,
    message
  };
};

const isInviteExpired = (invite: InviteSummary, nowMs: number): boolean => {
  return nowMs - invite.createdAt > INVITE_TTL_MS;
};

const resolveInviteRedeem = (
  invite: InviteSummary,
  userId: GenericId<"users">,
  nowMs: number
): InviteRedeemResult => {
  if (invite.usedAt) {
    return {
      ok: false,
      error: buildInviteError("invite_already_used", "Invite already used.")
    };
  }

  if (isInviteExpired(invite, nowMs)) {
    return {
      ok: false,
      error: buildInviteError("INVITE_EXPIRED", "Invite expired.")
    };
  }

  return {
    ok: true,
    value: buildInviteUsedSummary(invite, userId, nowMs)
  };
};

export type {
  InviteError,
  InviteErrorCode,
  InviteRedeemInput,
  InviteRedeemResult,
  InviteRole,
  InviteSummary,
  InviteUpsertInput,
  InviteUpsertResult,
  InviteRecord
};
export {
  INVITE_TTL_MS,
  buildInviteError,
  buildInviteSummary,
  buildInviteUsedSummary,
  isInviteExpired,
  resolveInviteRedeem,
  toInviteSummary
};
