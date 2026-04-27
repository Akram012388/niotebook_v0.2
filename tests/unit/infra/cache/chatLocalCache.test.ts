import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ChatCacheMessage,
  ChatCacheScope,
} from "@/infra/cache/chatLocalCache";
import { readChatCache, writeChatCache } from "@/infra/cache/chatLocalCache";

const { storage } = vi.hoisted(() => ({
  storage: new Map<string, string>(),
}));

vi.mock("@/infra/storageAdapter", () => ({
  storageAdapter: {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      storage.delete(key);
    }),
  },
}));

const message = (id: string, content: string): ChatCacheMessage => ({
  id,
  role: "assistant",
  content,
  timestampSec: 10,
  createdAt: 1_000,
});

describe("chat local cache scoping", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("isolates messages by thread id within the same lesson", () => {
    const lessonId = "lesson-shared";

    writeChatCache({ lessonId, threadId: "thread-one" }, [
      message("assistant-one", "thread one reply"),
    ]);
    writeChatCache({ lessonId, threadId: "thread-two" }, [
      message("assistant-two", "thread two reply"),
    ]);

    expect(readChatCache({ lessonId, threadId: "thread-one" })).toEqual([
      expect.objectContaining({ id: "assistant-one" }),
    ]);
    expect(readChatCache({ lessonId, threadId: "thread-two" })).toEqual([
      expect.objectContaining({ id: "assistant-two" }),
    ]);
  });

  it("isolates messages by account/user scope when lesson and thread match", () => {
    type AccountScopedChatCacheScope = ChatCacheScope & { accountId: string };

    const firstAccountScope = {
      lessonId: "lesson-shared",
      threadId: "thread-shared",
      accountId: "account-one",
    } satisfies AccountScopedChatCacheScope;
    const secondAccountScope = {
      lessonId: "lesson-shared",
      threadId: "thread-shared",
      accountId: "account-two",
    } satisfies AccountScopedChatCacheScope;

    writeChatCache(firstAccountScope, [
      message("assistant-account-one", "account one reply"),
    ]);
    writeChatCache(secondAccountScope, [
      message("assistant-account-two", "account two reply"),
    ]);

    expect(readChatCache(firstAccountScope)).toEqual([
      expect.objectContaining({ id: "assistant-account-one" }),
    ]);
    expect(readChatCache(secondAccountScope)).toEqual([
      expect.objectContaining({ id: "assistant-account-two" }),
    ]);
  });
});
