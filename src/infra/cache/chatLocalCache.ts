import { storageAdapter } from "../storageAdapter";

type ChatCacheMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestampSec: number;
  createdAt: number;
  requestId?: string;
};

const CACHE_VERSION = 2;
const CACHE_PREFIX = `niotebook.chatCache.v${CACHE_VERSION}`;
const CACHE_LIMIT = 50;

type ChatCacheScope = {
  lessonId: string;
  threadId?: string;
  accountId?: string;
};

const buildCacheKey = (scope: ChatCacheScope): string => {
  const accountPart = scope.accountId ? `account.${scope.accountId}.` : "";
  return scope.threadId
    ? `${CACHE_PREFIX}.${accountPart}thread.${scope.threadId}`
    : `${CACHE_PREFIX}.${accountPart}lesson.${scope.lessonId}`;
};

const readChatCache = (scope: ChatCacheScope): ChatCacheMessage[] => {
  const raw = storageAdapter.getItem(buildCacheKey(scope));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as ChatCacheMessage[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (message): message is ChatCacheMessage =>
        message !== null &&
        typeof message === "object" &&
        typeof message.id === "string" &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        typeof message.timestampSec === "number" &&
        typeof message.createdAt === "number",
    );
  } catch {
    return [];
  }
};

const writeChatCache = (
  scope: ChatCacheScope,
  messages: ChatCacheMessage[],
): void => {
  const trimmed = messages.slice(-CACHE_LIMIT);
  storageAdapter.setItem(buildCacheKey(scope), JSON.stringify(trimmed));
};

export type { ChatCacheMessage, ChatCacheScope };
export { readChatCache, writeChatCache };
