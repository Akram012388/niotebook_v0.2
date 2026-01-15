import type { GenericId } from "convex/values";

type ChatMessageRole = "user" | "assistant";

type ChatTimeWindow = {
  startSec: number;
  endSec: number;
};

type ChatThreadSummary = {
  id: GenericId<"chatThreads">;
  userId: GenericId<"users">;
  lessonId: GenericId<"lessons">;
};

type ChatMessageSummary = {
  id: GenericId<"chatMessages">;
  threadId: GenericId<"chatThreads">;
  role: ChatMessageRole;
  content: string;
  videoTimeSec: number;
  timeWindow: ChatTimeWindow;
  codeHash?: string;
  createdAt: number;
};

type ChatMessagePage = {
  messages: ChatMessageSummary[];
  nextCursor: string | null;
};

type ChatThreadResolution = {
  threadId: GenericId<"chatThreads"> | null;
  shouldCreate: boolean;
};

const resolveChatThreadResolution = (
  threadId: GenericId<"chatThreads"> | null
): ChatThreadResolution => {
  return {
    threadId,
    shouldCreate: threadId === null
  };
};

const orderChatMessages = (
  messages: ChatMessageSummary[]
): ChatMessageSummary[] => {
  return [...messages].sort((left, right) => left.createdAt - right.createdAt);
};

const applyChatMessageLimit = (
  messages: ChatMessageSummary[],
  limit: number
): ChatMessageSummary[] => {
  return messages.slice(0, limit);
};

export type {
  ChatMessagePage,
  ChatMessageRole,
  ChatMessageSummary,
  ChatThreadResolution,
  ChatThreadSummary,
  ChatTimeWindow
};
export {
  applyChatMessageLimit,
  orderChatMessages,
  resolveChatThreadResolution
};
