type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  badge: string;
  timestampSec: number;
};

export type { ChatMessage, ChatRole };
