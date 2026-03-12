import { describe, expect, it } from "vitest";
import {
  AI_REQUEST_LIMIT,
  AI_REQUEST_WINDOW_MS,
  evaluateRateLimit,
  type RateLimitRecord,
} from "../../src/domain/rate-limits";

describe("rate limit evaluation", (): void => {
  it("denies the 21st AI request in the same window", (): void => {
    let record: RateLimitRecord | null = null;
    const nowMs = 2000;

    for (let attempt = 1; attempt <= AI_REQUEST_LIMIT; attempt += 1) {
      const evaluation = evaluateRateLimit(
        "ai_request",
        "user-1",
        record,
        nowMs,
        AI_REQUEST_WINDOW_MS,
        AI_REQUEST_LIMIT,
      );

      record = evaluation.record;
      expect(evaluation.decision.ok).toBe(true);
    }

    const denied = evaluateRateLimit(
      "ai_request",
      "user-1",
      record,
      nowMs,
      AI_REQUEST_WINDOW_MS,
      AI_REQUEST_LIMIT,
    );

    expect(denied.decision.ok).toBe(false);
  });
});
