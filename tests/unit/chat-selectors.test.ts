import { describe, expect, it } from "vitest";
import {
  applyChatMessageLimit,
  orderChatMessages,
  resolveChatThreadResolution,
  type ChatMessageSummary,
  type ChatMessageRole,
  type ChatThreadResolution,
} from "../../src/domain/chat";

describe("chat selectors", (): void => {
  it("signals when a chat thread should be created", (): void => {
    const existingId = "thread-1" as ChatThreadResolution["threadId"];

    const existingResolution = resolveChatThreadResolution(existingId);
    const missingResolution = resolveChatThreadResolution(null);

    expect(existingResolution).toEqual({
      threadId: existingId,
      shouldCreate: false,
    });
    expect(missingResolution).toEqual({
      threadId: null,
      shouldCreate: true,
    });
  });

  it("orders chat messages by createdAt", (): void => {
    const role: ChatMessageRole = "user";
    const threadId = "thread-1" as ChatMessageSummary["threadId"];

    const messages: ChatMessageSummary[] = [
      {
        id: "message-2" as ChatMessageSummary["id"],
        threadId,
        role,
        content: "Second",
        videoTimeSec: 20,
        timeWindow: { startSec: 10, endSec: 70 },
        createdAt: 2000,
      },
      {
        id: "message-1" as ChatMessageSummary["id"],
        threadId,
        role,
        content: "First",
        videoTimeSec: 10,
        timeWindow: { startSec: 0, endSec: 60 },
        createdAt: 1000,
      },
    ];

    const ordered = orderChatMessages(messages);

    expect(ordered[0]?.id).toBe("message-1");
    expect(ordered[1]?.id).toBe("message-2");
  });

  it("applies a message limit", (): void => {
    const role: ChatMessageRole = "assistant";
    const threadId = "thread-1" as ChatMessageSummary["threadId"];

    const messages: ChatMessageSummary[] = [
      {
        id: "message-1" as ChatMessageSummary["id"],
        threadId,
        role,
        content: "One",
        videoTimeSec: 10,
        timeWindow: { startSec: 0, endSec: 60 },
        createdAt: 1000,
      },
      {
        id: "message-2" as ChatMessageSummary["id"],
        threadId,
        role,
        content: "Two",
        videoTimeSec: 20,
        timeWindow: { startSec: 10, endSec: 70 },
        createdAt: 2000,
      },
    ];

    const limited = applyChatMessageLimit(messages, 1);

    expect(limited).toHaveLength(1);
    expect(limited[0]?.id).toBe("message-2");
  });
});
