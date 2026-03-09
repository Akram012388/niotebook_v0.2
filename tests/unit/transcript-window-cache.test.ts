import { describe, expect, it } from "vitest";
import {
  cacheTranscriptWindowMemory,
  getCachedTranscriptWindowMemory,
} from "../../src/infra/cache/transcriptWindowCache";

const lessonId = "lesson-1";

describe("transcript window cache", (): void => {
  it("returns cached window data per lesson", (): void => {
    const firstSegments = [
      {
        idx: 1,
        startSec: 0,
        endSec: 5,
        textNormalized: "a",
      },
    ];
    const secondSegments = [
      {
        idx: 2,
        startSec: 6,
        endSec: 10,
        textNormalized: "b",
      },
    ];

    cacheTranscriptWindowMemory(lessonId, 0, 10, firstSegments);
    const cachedFirst = getCachedTranscriptWindowMemory(lessonId);

    cacheTranscriptWindowMemory(lessonId, 10, 20, secondSegments);
    const cachedSecond = getCachedTranscriptWindowMemory(lessonId);

    expect(cachedFirst).toEqual({
      startSec: 0,
      endSec: 10,
      segments: firstSegments,
    });
    expect(cachedSecond).toEqual({
      startSec: 10,
      endSec: 20,
      segments: secondSegments,
    });
  });
});
