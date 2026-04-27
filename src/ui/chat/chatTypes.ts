type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  badge: string;
  timestampSec: number;
  createdAt: number;
  /** UI-only ordering key for optimistic messages during an active stream. */
  sortAt?: number;
  isStreaming?: boolean;
  requestId?: string;
};

type ChatStreamState = "idle" | "streaming";

export type { ChatMessage, ChatRole, ChatStreamState };
