import { describe, expect, it } from "vitest";
import {
  AI_FALLBACK_TIMEOUT_MS,
  shouldFallbackForStatus,
  shouldFallbackForTimeout,
} from "../../src/domain/ai-fallback";

describe("ai fallback policy", (): void => {
  it("falls back on 429 and 5xx", (): void => {
    expect(shouldFallbackForStatus(429)).toBe(true);
    expect(shouldFallbackForStatus(500)).toBe(true);
    expect(shouldFallbackForStatus(503)).toBe(true);
    expect(shouldFallbackForStatus(599)).toBe(true);
    expect(shouldFallbackForStatus(404)).toBe(false);
  });

  it("falls back on timeout >= 10s", (): void => {
    expect(shouldFallbackForTimeout(AI_FALLBACK_TIMEOUT_MS - 1)).toBe(false);
    expect(shouldFallbackForTimeout(AI_FALLBACK_TIMEOUT_MS)).toBe(true);
    expect(shouldFallbackForTimeout(AI_FALLBACK_TIMEOUT_MS + 500)).toBe(true);
  });
});
