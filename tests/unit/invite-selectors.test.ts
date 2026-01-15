import type { GenericId } from "convex/values";
import { describe, expect, it } from "vitest";
import {
  buildInviteError,
  buildInviteSummary,
  buildInviteUsedSummary,
  toInviteSummary,
  type InviteRecord
} from "../../src/domain/invites";

describe("invite helpers", (): void => {
  it("maps invite records to summaries", (): void => {
    const record: InviteRecord = {
      _id: "invite-1" as GenericId<"invites">,
      code: "CODE-1",
      createdAt: 1000,
      inviteBatchId: "batch-1",
      role: "user"
    };

    expect(toInviteSummary(record)).toEqual({
      id: record._id,
      code: "CODE-1",
      createdAt: 1000,
      inviteBatchId: "batch-1",
      role: "user"
    });
  });

  it("builds invite summaries", (): void => {
    const summary = buildInviteSummary(
      "invite-2" as GenericId<"invites">,
      { code: "CODE-2", inviteBatchId: "batch-2", role: "admin" },
      2000
    );

    expect(summary).toEqual({
      id: "invite-2",
      code: "CODE-2",
      createdAt: 2000,
      inviteBatchId: "batch-2",
      role: "admin"
    });
  });

  it("marks invites as used", (): void => {
    const base = buildInviteSummary(
      "invite-3" as GenericId<"invites">,
      { code: "CODE-3", inviteBatchId: "batch-3", role: "user" },
      3000
    );

    const used = buildInviteUsedSummary(
      base,
      "user-1" as GenericId<"users">,
      3500
    );

    expect(used.usedAt).toBe(3500);
    expect(used.usedByUserId).toBe("user-1");
  });

  it("builds invite errors", (): void => {
    const error = buildInviteError("invite_not_found", "Missing");

    expect(error).toEqual({
      code: "invite_not_found",
      message: "Missing"
    });
  });
});
