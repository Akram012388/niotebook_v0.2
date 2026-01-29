import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { NIO_SYSTEM_PROMPT } from "../../src/domain/nioPrompt";

const extractPromptBlock = (content: string): string => {
  const match = content.match(/```text\n([\s\S]*?)\n```/);

  if (!match) {
    throw new Error("Prompt block missing in ADR-005.");
  }

  return match[1];
};

describe("nio prompt", (): void => {
  it("matches ADR-005 prompt verbatim", (): void => {
    const document = readFileSync("docs/ADR-005-nio-prompt.md", "utf8");
    const normalizedDocument = document.replace(/\r\n/g, "\n");
    const promptBlock = extractPromptBlock(normalizedDocument);
    const normalizedPrompt = NIO_SYSTEM_PROMPT.replace(/\r\n/g, "\n");

    expect(normalizedPrompt).toBe(promptBlock);
  });
});
