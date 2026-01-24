import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("assistant message idempotency", (): void => {
  it("defines requestId index and completion mutation", (): void => {
    const schema = readFileSync("convex/schema.ts", "utf8");
    const chatModule = readFileSync("convex/chat.ts", "utf8");

    expect(schema).toContain("by_threadId_requestId");
    expect(chatModule).toContain("completeAssistantMessage");
    expect(chatModule).toContain("by_threadId_requestId");
  });
});
