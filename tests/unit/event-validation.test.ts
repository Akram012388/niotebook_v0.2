import { describe, expect, it } from "vitest";
import { buildEventLogError, validateEventMetadata } from "../../src/domain/events";

describe("event validation", (): void => {
  it("accepts valid metadata", (): void => {
    const result = validateEventMetadata("invite_created", {
      inviteId: "invite-1",
      inviteBatchId: "batch-1",
      role: "user"
    });

    expect(result.ok).toBe(true);
  });

  it("rejects invalid metadata", (): void => {
    const result = validateEventMetadata("invite_created", {
      inviteBatchId: "batch-2",
      role: "user"
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toEqual(buildEventLogError("INVALID_EVENT_METADATA"));
    }
  });
});
