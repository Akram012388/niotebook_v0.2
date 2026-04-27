import { describe, expect, it } from "vitest";
import {
  AI_FALLBACK_TIMEOUT_MS,
  shouldFallbackForStatus,
  shouldFallbackForTimeout,
} from "@/domain/ai-fallback";

describe("ai fallback selectors", () => {
  it("falls back for rate limits and provider 5xx responses only", () => {
    expect(shouldFallbackForStatus(429)).toBe(true);
    expect(shouldFallbackForStatus(500)).toBe(true);
    expect(shouldFallbackForStatus(599)).toBe(true);
    expect(shouldFallbackForStatus(400)).toBe(false);
    expect(shouldFallbackForStatus(401)).toBe(false);
  });

  it("falls back when first-token timeout budget is exhausted", () => {
    expect(shouldFallbackForTimeout(AI_FALLBACK_TIMEOUT_MS - 1)).toBe(false);
    expect(shouldFallbackForTimeout(AI_FALLBACK_TIMEOUT_MS)).toBe(true);
  });
});
