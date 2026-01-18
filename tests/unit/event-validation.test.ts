import { describe, expect, it } from "vitest";
import {
  buildEventLogError,
  validateEventMetadata,
  validateEventUserId,
} from "../../src/domain/events";

describe("event validation", (): void => {
  it("accepts valid metadata", (): void => {
    const result = validateEventMetadata("invite_issued", {
      inviteId: "invite-1",
      createdBy: "user-1",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects invalid metadata", (): void => {
    const result = validateEventMetadata("invite_issued", {
      inviteId: "invite-1",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toEqual(
        buildEventLogError("INVALID_EVENT_METADATA"),
      );
    }
  });

  it("rejects missing user id", (): void => {
    const result = validateEventUserId(undefined);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toEqual(buildEventLogError("MISSING_USER_ID"));
    }
  });
});
