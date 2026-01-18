import { describe, expect, it } from "vitest";
import { evaluateTranscriptIngest } from "../../src/domain/ingest";

describe("transcript ingest", (): void => {
  it("flags missing transcripts", (): void => {
    const result = evaluateTranscriptIngest([], 1200);

    expect(result.status).toBe("missing");
    expect(result.segmentCount).toBe(0);
  });

  it("flags duration mismatch", (): void => {
    const result = evaluateTranscriptIngest(
      [
        {
          idx: 0,
          startSec: 0,
          endSec: 20,
          textRaw: "Hello",
          textNormalized: "Hello",
        },
        {
          idx: 1,
          startSec: 20,
          endSec: 900,
          textRaw: "World",
          textNormalized: "World",
        },
      ],
      300,
    );

    expect(result.status).toBe("warn");
    expect(result.durationMismatchSec).toBeGreaterThan(120);
  });
});
