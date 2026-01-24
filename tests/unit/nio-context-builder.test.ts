import { describe, expect, it } from "vitest";
import {
  buildNioContext,
  APPROX_CONTEXT_CHAR_BUDGET,
  SAFETY_MARGIN_CHARS,
  type NioContextBuildInput,
} from "../../src/domain/nioContextBuilder";

const baseInput: NioContextBuildInput = {
  systemPrompt: "SYSTEM",
  lessonId: "lesson-1",
  videoTimeSec: 42,
  transcript: {
    startSec: 0,
    endSec: 60,
    lines: ["Intro line"],
  },
  code: {
    language: "js",
    code: "console.log('hi');",
    codeHash: "hash-1",
  },
  recentMessages: [
    { role: "user", content: "oldest" },
    { role: "assistant", content: "newest" },
  ],
  userMessage: "current question",
};

describe("nio context builder", (): void => {
  it("builds deterministic context output", (): void => {
    const first = buildNioContext(baseInput);
    const second = buildNioContext(baseInput);

    expect(first).toEqual(second);
  });

  it("guards against oversized system prompt", (): void => {
    const oversized = "x".repeat(
      APPROX_CONTEXT_CHAR_BUDGET - SAFETY_MARGIN_CHARS + 10,
    );
    const result = buildNioContext({ ...baseInput, systemPrompt: oversized });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("VALIDATION_ERROR");
    }
  });

  it("drops oldest messages before trimming transcript", (): void => {
    const transcriptText = `TRANSCRIPT_START ${"t".repeat(20000)} TRANSCRIPT_END`;
    const codeText = `CODE_START ${"c".repeat(2000)} CODE_END`;
    const input: NioContextBuildInput = {
      ...baseInput,
      transcript: {
        startSec: 0,
        endSec: 60,
        lines: [transcriptText],
      },
      code: {
        language: "js",
        code: codeText,
      },
      recentMessages: [
        { role: "user", content: "oldest message".repeat(200) },
        { role: "assistant", content: "newest message" },
      ],
    };

    const result = buildNioContext(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.contextText).not.toContain("oldest message");
      expect(result.contextText).not.toContain("TRANSCRIPT_END");
      expect(result.contextText).toContain("CODE_END");
    }
  });

  it("trims code after transcript when still over budget", (): void => {
    const codeText = `CODE_START ${"c".repeat(15000)} CODE_END`;
    const input: NioContextBuildInput = {
      ...baseInput,
      transcript: {
        startSec: 0,
        endSec: 60,
        lines: [],
      },
      code: {
        language: "js",
        code: codeText,
      },
      recentMessages: [],
    };

    const result = buildNioContext(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.contextText).not.toContain("CODE_END");
    }
  });
});
