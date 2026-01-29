import { describe, expect, it } from "vitest";
import { AI_FALLBACK_TIMEOUT_MS } from "../../src/domain/ai-fallback";
import { shouldFallbackBeforeFirstToken } from "../../src/infra/ai/fallbackGate";
import { createProviderStreamError } from "../../src/infra/ai/providerTypes";

describe("fallback gate", (): void => {
  it("does not fallback after first token", (): void => {
    const error = createProviderStreamError("rate limit", 429, "gemini");
    const result = shouldFallbackBeforeFirstToken({
      hasFirstToken: true,
      elapsedMs: AI_FALLBACK_TIMEOUT_MS + 1,
      error,
    });

    expect(result).toBe(false);
  });

  it("falls back on timeout before first token", (): void => {
    const result = shouldFallbackBeforeFirstToken({
      hasFirstToken: false,
      elapsedMs: AI_FALLBACK_TIMEOUT_MS,
    });

    expect(result).toBe(true);
  });

  it("falls back on provider 429 before first token", (): void => {
    const error = createProviderStreamError("rate limit", 429, "gemini");
    const result = shouldFallbackBeforeFirstToken({
      hasFirstToken: false,
      elapsedMs: 1000,
      error,
    });

    expect(result).toBe(true);
  });

  it("does not fallback on generic stream errors", (): void => {
    const error = createProviderStreamError(
      "stream failed",
      undefined,
      "gemini",
    );
    const result = shouldFallbackBeforeFirstToken({
      hasFirstToken: false,
      elapsedMs: 1000,
      error,
    });

    expect(result).toBe(false);
  });
});
