import { makeFunctionReference } from "convex/server";
import type { ChatMessageSummary, ChatThreadSummary } from "../../domain/chat";

type ChatThreadReference = import("convex/server").FunctionReference<
  "query",
  "public",
  { lessonId: string },
  ChatThreadSummary | null
>;

type ChatThreadCreateReference = import("convex/server").FunctionReference<
  "mutation",
  "public",
  { lessonId: string },
  string
>;

type ChatMessageReference = import("convex/server").FunctionReference<
  "query",
  "public",
  { threadId: string; limit: number; cursor?: string },
  { messages: ChatMessageSummary[]; nextCursor: string | null }
>;

type ChatCreateMessageReference = import("convex/server").FunctionReference<
  "mutation",
  "public",
  {
    threadId: string;
    role: "user" | "assistant";
    content: string;
    videoTimeSec: number;
    timeWindow: { startSec: number; endSec: number };
    codeHash?: string;
  },
  ChatMessageSummary
>;

const getChatThreadRef = makeFunctionReference<"query">(
  "chat:getChatThread",
) as ChatThreadReference;
const ensureChatThreadRef = makeFunctionReference<"mutation">(
  "chat:ensureChatThread",
) as ChatThreadCreateReference;
const getChatMessagesRef = makeFunctionReference<"query">(
  "chat:getChatMessages",
) as ChatMessageReference;
const createChatMessageRef = makeFunctionReference<"mutation">(
  "chat:createChatMessage",
) as ChatCreateMessageReference;

export {
  createChatMessageRef,
  ensureChatThreadRef,
  getChatMessagesRef,
  getChatThreadRef,
};
