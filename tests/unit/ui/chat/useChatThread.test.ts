// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMutation, useQuery } from "convex/react";
import { useChatThread } from "@/ui/chat/useChatThread";

vi.mock("convex/react", () => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
}));

vi.mock("@/infra/auth/authTokenContext", () => ({
  useAuthToken: vi.fn(() => vi.fn(async () => "token")),
}));

const sendContext = {
  videoTimeSec: 42,
  transcript: {
    startSec: 0,
    endSec: 60,
    lines: ["A transcript line."],
  },
  code: {
    language: "python",
  },
};

describe("useChatThread", () => {
  beforeEach(() => {
    let mutationCallIndex = 0;
    vi.mocked(useQuery).mockImplementation(((...call: unknown[]) => {
      const args = call[1];
      if (args === "skip") {
        return undefined;
      }
      if (args && typeof args === "object" && "lessonId" in args) {
        return { id: "thread-1", userId: "user-1" };
      }
      if (args && typeof args === "object" && "threadId" in args) {
        return { messages: [], nextCursor: null };
      }
      return [];
    }) as never);
    vi.mocked(useMutation).mockImplementation((() => {
      const index = mutationCallIndex % 3;
      mutationCallIndex += 1;
      if (index === 0) {
        return vi.fn(async () => "thread-1") as never;
      }
      if (index === 1) {
        return vi.fn(
          () =>
            new Promise(() => {
              // Keep createChatMessage pending so the hook only exposes the
              // optimistic user message and cannot add the assistant first.
            }),
        ) as never;
      }
      return vi.fn(async () => undefined) as never;
    }) as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
  });

  it("places the optimistic user prompt before any assistant placeholder", async () => {
    const { result } = renderHook(() => useChatThread("lesson-1", "Lecture 1"));

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      void result.current.sendMessage("what's he saying here?", sendContext);
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });

    expect(result.current.messages[0]).toMatchObject({
      role: "user",
      content: "what's he saying here?",
    });
  });
});
