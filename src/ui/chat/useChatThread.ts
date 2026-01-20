"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { ChatMessageSummary, ChatThreadSummary } from "../../domain/chat";
import {
  createChatMessageRef,
  ensureChatThreadRef,
  getChatMessagesRef,
  getChatThreadRef,
} from "./convexChat";

const PAGE_LIMIT = 20;

const useChatThread = (
  lessonId: string,
): {
  thread: ChatThreadSummary | null;
  messages: ChatMessageSummary[];
  threadId: string | null;
  sendMessage: (content: string, videoTimeSec: number) => Promise<void>;
} => {
  const isConvexEnabled = process.env.NEXT_PUBLIC_DISABLE_CONVEX !== "true";

  const thread = useQuery(
    getChatThreadRef,
    isConvexEnabled ? { lessonId } : "skip",
  );
  const ensureThread = useMutation(ensureChatThreadRef);

  const [localThreadId, setLocalThreadId] = useState<string | null>(null);

  const activeThreadId = (thread?.id as string | undefined) ?? localThreadId;

  const messagesPage = useQuery(
    getChatMessagesRef,
    activeThreadId && isConvexEnabled
      ? { threadId: activeThreadId, limit: PAGE_LIMIT }
      : "skip",
  );

  const createMessage = useMutation(createChatMessageRef);

  const messages = useMemo(() => messagesPage?.messages ?? [], [messagesPage]);

  const sendMessage = useCallback(
    async (content: string, videoTimeSec: number): Promise<void> => {
      if (!isConvexEnabled) {
        setLocalThreadId((prev) => prev ?? "local-thread");
        return;
      }

      const resolvedThreadId =
        activeThreadId ?? (await ensureThread({ lessonId }));

      if (!activeThreadId) {
        setLocalThreadId(resolvedThreadId as string);
      }

      const timeWindow = {
        startSec: Math.max(0, videoTimeSec - 60),
        endSec: videoTimeSec + 60,
      };
      await createMessage({
        threadId: resolvedThreadId as string,
        role: "user",
        content,
        videoTimeSec,
        timeWindow,
      });
    },
    [activeThreadId, createMessage, ensureThread, isConvexEnabled, lessonId],
  );

  return {
    thread: thread ?? null,
    messages,
    threadId: activeThreadId ?? null,
    sendMessage,
  };
};

export { useChatThread };
