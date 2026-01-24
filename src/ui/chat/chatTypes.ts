type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  badge: string;
  timestampSec: number;
  createdAt: number;
  isStreaming?: boolean;
  requestId?: string;
};

type ChatStreamState = "idle" | "streaming" | "error";

export type { ChatMessage, ChatRole, ChatStreamState };
