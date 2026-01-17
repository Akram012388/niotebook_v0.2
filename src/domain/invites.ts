import type { InviteId, UserId } from "./ids";

type InviteRole = "user" | "admin";

type InviteSummary = {
  id: InviteId;
  code: string;
  createdAt: number;
  usedAt?: number;
  usedByUserId?: UserId;
  inviteBatchId: string;
  role: InviteRole;
};

type InviteUpsertInput = {
  code: string;
  inviteBatchId: string;
  role: InviteRole;
};

type InviteRedeemInput = {
  inviteId: InviteId;
  userId: UserId;
};

type InviteErrorCode =
  | "INVITE_NOT_FOUND"
  | "INVITE_ALREADY_USED"
  | "INVITE_EXPIRED"
  | "RATE_LIMITED";

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
  _id: InviteId;
  code: string;
  createdAt: number;
  usedAt?: number;
  usedByUserId?: UserId;
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
    role: record.role,
  };
};

const buildInviteSummary = (
  id: InviteId,
  input: InviteUpsertInput,
  createdAt: number,
): InviteSummary => {
  return {
    id,
    code: input.code,
    createdAt,
    inviteBatchId: input.inviteBatchId,
    role: input.role,
  };
};

const buildInviteUsedSummary = (
  invite: InviteSummary,
  userId: UserId,
  usedAt: number,
): InviteSummary => {
  return {
    ...invite,
    usedAt,
    usedByUserId: userId,
  };
};

const INVITE_ERROR_MESSAGES: Record<InviteErrorCode, string> = {
  INVITE_NOT_FOUND: "Invite not found.",
  INVITE_ALREADY_USED: "Invite already used.",
  INVITE_EXPIRED: "Invite expired.",
  RATE_LIMITED: "Invite redemption rate limited.",
};

const buildInviteError = (code: InviteErrorCode): InviteError => {
  return {
    code,
    message: INVITE_ERROR_MESSAGES[code],
  };
};

const isInviteExpired = (invite: InviteSummary, nowMs: number): boolean => {
  return nowMs - invite.createdAt > INVITE_TTL_MS;
};

const resolveInviteRedeem = (
  invite: InviteSummary,
  userId: UserId,
  nowMs: number,
): InviteRedeemResult => {
  if (invite.usedAt) {
    return {
      ok: false,
      error: buildInviteError("INVITE_ALREADY_USED"),
    };
  }

  if (isInviteExpired(invite, nowMs)) {
    return {
      ok: false,
      error: buildInviteError("INVITE_EXPIRED"),
    };
  }

  return {
    ok: true,
    value: buildInviteUsedSummary(invite, userId, nowMs),
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
  InviteRecord,
};
export {
  INVITE_TTL_MS,
  buildInviteError,
  buildInviteSummary,
  buildInviteUsedSummary,
  isInviteExpired,
  resolveInviteRedeem,
  toInviteSummary,
};
