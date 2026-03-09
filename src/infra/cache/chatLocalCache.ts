import { storageAdapter } from "../storageAdapter";

type ChatCacheMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestampSec: number;
  createdAt: number;
  requestId?: string;
};

const CACHE_VERSION = 1;
const CACHE_PREFIX = `niotebook.chatCache.v${CACHE_VERSION}`;
const CACHE_LIMIT = 50;

const buildCacheKey = (lessonId: string): string => {
  return `${CACHE_PREFIX}.${lessonId}`;
};

const readChatCache = (lessonId: string): ChatCacheMessage[] => {
  const raw = storageAdapter.getItem(buildCacheKey(lessonId));
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
  lessonId: string,
  messages: ChatCacheMessage[],
): void => {
  const trimmed = messages.slice(-CACHE_LIMIT);
  storageAdapter.setItem(buildCacheKey(lessonId), JSON.stringify(trimmed));
};

export type { ChatCacheMessage };
export { readChatCache, writeChatCache };
