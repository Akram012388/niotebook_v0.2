type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  badge: string;
};

export type { ChatMessage, ChatRole };
