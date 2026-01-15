import type { GenericId } from "convex/values";
import { describe, expect, it } from "vitest";
import type { EventInput } from "../../src/domain/events";

describe("event taxonomy", (): void => {
  it("accepts invite created event shape", (): void => {
    const event: EventInput<"invite_created"> = {
      eventType: "invite_created",
      userId: "user-1" as GenericId<"users">,
      metadata: {
        inviteId: "invite-1" as GenericId<"invites">,
        inviteBatchId: "batch-1",
        role: "user"
      }
    };

    expect(event.metadata.role).toBe("user");
  });

  it("accepts transcript ingest success event shape", (): void => {
    const event: EventInput<"transcript_ingest_succeeded"> = {
      eventType: "transcript_ingest_succeeded",
      lessonId: "lesson-1" as GenericId<"lessons">,
      metadata: {
        lessonId: "lesson-1" as GenericId<"lessons">,
        segmentCount: 10,
        transcriptDurationSec: 1200
      }
    };

    expect(event.metadata.segmentCount).toBe(10);
  });
});
