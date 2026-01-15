import type { GenericId } from "convex/values";
import { describe, expect, it } from "vitest";
import {
  toTranscriptWindowSegments,
  type TranscriptSegment
} from "../../src/domain/transcript";

describe("transcript window", (): void => {
  it("returns ordered window segments with overlaps", (): void => {
    const lessonId = "lesson-1" as GenericId<"lessons">;

    const segments: TranscriptSegment[] = [
      {
        lessonId,
        idx: 2,
        startSec: 3,
        endSec: 6,
        textNormalized: "overlap"
      },
      {
        lessonId,
        idx: 1,
        startSec: 0,
        endSec: 2,
        textNormalized: "intro"
      },
      {
        lessonId,
        idx: 3,
        startSec: 7,
        endSec: 9,
        textNormalized: "middle"
      }
    ];

    const windowSegments = toTranscriptWindowSegments(segments, 5, 10);

    expect(windowSegments).toHaveLength(2);
    expect(windowSegments[0]).toMatchObject({
      idx: 2,
      startSec: 3,
      endSec: 6,
      textNormalized: "overlap"
    });
    expect(windowSegments[1]).toMatchObject({
      idx: 3,
      startSec: 7,
      endSec: 9,
      textNormalized: "middle"
    });
  });

  it("returns empty array when no segments", (): void => {
    const windowSegments = toTranscriptWindowSegments([], 0, 10);

    expect(windowSegments).toEqual([]);
  });
});
