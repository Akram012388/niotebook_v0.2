import { describe, expect, it } from "vitest";
import {
  INVITE_TTL_MS,
  buildInviteError,
  buildInviteSummary,
  buildInviteUsedSummary,
  resolveInviteRedeem,
  toInviteSummary,
  type InviteRecord,
  type InviteSummary,
} from "../../src/domain/invites";

describe("invite helpers", (): void => {
  it("maps invite records to summaries", (): void => {
    const record: InviteRecord = {
      _id: "invite-1" as InviteSummary["id"],
      code: "CODE-1",
      createdAt: 1000,
      inviteBatchId: "batch-1",
      role: "user",
    };

    expect(toInviteSummary(record)).toEqual({
      id: record._id,
      code: "CODE-1",
      createdAt: 1000,
      inviteBatchId: "batch-1",
      role: "user",
    });
  });

  it("builds invite summaries", (): void => {
    const summary = buildInviteSummary(
      "invite-2" as InviteSummary["id"],
      { code: "CODE-2", inviteBatchId: "batch-2", role: "admin" },
      2000,
    );

    expect(summary).toEqual({
      id: "invite-2",
      code: "CODE-2",
      createdAt: 2000,
      inviteBatchId: "batch-2",
      role: "admin",
    });
  });

  it("marks invites as used", (): void => {
    const base = buildInviteSummary(
      "invite-3" as InviteSummary["id"],
      { code: "CODE-3", inviteBatchId: "batch-3", role: "user" },
      3000,
    );

    const used = buildInviteUsedSummary(
      base,
      "user-1" as NonNullable<InviteSummary["usedByUserId"]>,
      3500,
    );

    expect(used.usedAt).toBe(3500);
    expect(used.usedByUserId).toBe("user-1");
  });

  it("builds invite errors", (): void => {
    const error = buildInviteError("INVITE_NOT_FOUND");

    expect(error).toEqual({
      code: "INVITE_NOT_FOUND",
      message: "Invite not found.",
    });
  });

  it("redeems invite within TTL", (): void => {
    const invite = buildInviteSummary(
      "invite-4" as InviteSummary["id"],
      { code: "CODE-4", inviteBatchId: "batch-4", role: "user" },
      0,
    );

    const userId = "user-2" as NonNullable<InviteSummary["usedByUserId"]>;
    const nowMs = INVITE_TTL_MS - 1000;

    const result = resolveInviteRedeem(invite, userId, nowMs);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.usedAt).toBe(nowMs);
      expect(result.value.usedByUserId).toBe(userId);
    }
  });

  it("rejects expired invites", (): void => {
    const invite = buildInviteSummary(
      "invite-5" as InviteSummary["id"],
      { code: "CODE-5", inviteBatchId: "batch-5", role: "admin" },
      0,
    );

    const result = resolveInviteRedeem(
      invite,
      "user-3" as NonNullable<InviteSummary["usedByUserId"]>,
      INVITE_TTL_MS + 1,
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error.code).toBe("INVITE_EXPIRED");
    }
  });
});
