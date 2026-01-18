import { describe, expect, it } from "vitest";
import type { EventInput, SystemEventInput } from "../../src/domain/events";

describe("event taxonomy", (): void => {
  it("accepts invite issued event shape", (): void => {
    const event: EventInput<"invite_issued"> = {
      eventType: "invite_issued",
      userId: "user-1" as EventInput<"invite_issued">["userId"],
      metadata: {
        inviteId:
          "invite-1" as EventInput<"invite_issued">["metadata"]["inviteId"],
        createdBy:
          "user-1" as EventInput<"invite_issued">["metadata"]["createdBy"],
      },
    };

    expect(event.metadata.createdBy).toBe("user-1");
  });

  it("accepts transcript ingest success event shape", (): void => {
    const event: SystemEventInput<"transcript_ingest_succeeded"> = {
      eventType: "transcript_ingest_succeeded",
      lessonId:
        "lesson-1" as SystemEventInput<"transcript_ingest_succeeded">["lessonId"],
      metadata: {
        lessonId:
          "lesson-1" as SystemEventInput<"transcript_ingest_succeeded">["metadata"]["lessonId"],
        segmentCount: 10,
        transcriptDurationSec: 1200,
      },
    };

    expect(event.metadata.segmentCount).toBe(10);
  });
});
