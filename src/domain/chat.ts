import type { ChatMessageId, ChatThreadId, LessonId, UserId } from "./ids";

type ChatMessageRole = "user" | "assistant";

type ChatTimeWindow = {
  startSec: number;
  endSec: number;
};

type ChatThreadSummary = {
  id: ChatThreadId;
  userId: UserId;
  lessonId: LessonId;
};

type ChatMessageSummary = {
  id: ChatMessageId;
  threadId: ChatThreadId;
  role: ChatMessageRole;
  content: string;
  videoTimeSec: number;
  timeWindow: ChatTimeWindow;
  codeHash?: string;
  requestId?: string;
  provider?: string;
  model?: string;
  latencyMs?: number;
  usedFallback?: boolean;
  contextHash?: string;
  createdAt: number;
};

type ChatMessagePage = {
  messages: ChatMessageSummary[];
  nextCursor: string | null;
};

type ChatThreadResolution = {
  threadId: ChatThreadId | null;
  shouldCreate: boolean;
};

const resolveChatThreadResolution = (
  threadId: ChatThreadId | null,
): ChatThreadResolution => {
  return {
    threadId,
    shouldCreate: threadId === null,
  };
};

const orderChatMessages = (
  messages: ChatMessageSummary[],
): ChatMessageSummary[] => {
  return [...messages].sort((left, right) => left.createdAt - right.createdAt);
};

const applyChatMessageLimit = (
  messages: ChatMessageSummary[],
  limit: number,
): ChatMessageSummary[] => {
  if (limit <= 0) {
    return [];
  }

  return messages.slice(-limit);
};

export type {
  ChatMessagePage,
  ChatMessageRole,
  ChatMessageSummary,
  ChatThreadResolution,
  ChatThreadSummary,
  ChatTimeWindow,
};
export {
  applyChatMessageLimit,
  orderChatMessages,
  resolveChatThreadResolution,
};
