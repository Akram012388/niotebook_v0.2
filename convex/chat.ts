import { mutationGeneric, queryGeneric, type IndexRangeBuilder } from "convex/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import {
  applyChatMessageLimit,
  orderChatMessages,
  resolveChatThreadResolution,
  type ChatMessagePage,
  type ChatMessageRole,
  type ChatMessageSummary,
  type ChatThreadSummary,
  type ChatTimeWindow
} from "../src/domain/chat";

type ChatThreadRecord = {
  _id: GenericId<"chatThreads">;
  _creationTime: number;
  userId: GenericId<"users">;
  lessonId: GenericId<"lessons">;
};

type ChatMessageRecord = {
  _id: GenericId<"chatMessages">;
  _creationTime: number;
  threadId: GenericId<"chatThreads">;
  role: ChatMessageRole;
  content: string;
  videoTimeSec: number;
  timeWindowStartSec: number;
  timeWindowEndSec: number;
  codeHash?: string;
  createdAt: number;
};

type ChatThreadIndexFields = ["userId", "lessonId"];

type ChatMessageIndexFields = ["threadId", "createdAt"];

const toChatThreadSummary = (thread: ChatThreadRecord): ChatThreadSummary => {
  return {
    id: thread._id,
    userId: thread.userId,
    lessonId: thread.lessonId
  };
};

const toChatMessageSummary = (message: ChatMessageRecord): ChatMessageSummary => {
  const timeWindow: ChatTimeWindow = {
    startSec: message.timeWindowStartSec,
    endSec: message.timeWindowEndSec
  };

  return {
    id: message._id,
    threadId: message.threadId,
    role: message.role,
    content: message.content,
    videoTimeSec: message.videoTimeSec,
    timeWindow,
    codeHash: message.codeHash,
    createdAt: message.createdAt
  };
};

const getChatThread = queryGeneric({
  args: {
    userId: v.id("users"),
    lessonId: v.id("lessons")
  },
  handler: async (ctx, args): Promise<ChatThreadSummary | null> => {
    const thread = (await ctx.db
      .query("chatThreads")
      .withIndex("by_userId_lessonId", (query) => {
        const typedQuery = query as IndexRangeBuilder<
          ChatThreadRecord,
          ChatThreadIndexFields
        >;

        return typedQuery
          .eq("userId", args.userId)
          .eq("lessonId", args.lessonId);
      })
      .first()) as ChatThreadRecord | null;

    return thread ? toChatThreadSummary(thread) : null;
  }
});

const ensureChatThread = mutationGeneric({
  args: {
    userId: v.id("users"),
    lessonId: v.id("lessons")
  },
  handler: async (ctx, args): Promise<GenericId<"chatThreads">> => {
    const existing = (await ctx.db
      .query("chatThreads")
      .withIndex("by_userId_lessonId", (query) => {
        const typedQuery = query as IndexRangeBuilder<
          ChatThreadRecord,
          ChatThreadIndexFields
        >;

        return typedQuery
          .eq("userId", args.userId)
          .eq("lessonId", args.lessonId);
      })
      .first()) as ChatThreadRecord | null;

    const resolution = resolveChatThreadResolution(existing?._id ?? null);

    if (!resolution.shouldCreate && resolution.threadId) {
      return resolution.threadId;
    }

    return ctx.db.insert("chatThreads", {
      userId: args.userId,
      lessonId: args.lessonId
    });
  }
});

const getChatMessages = queryGeneric({
  args: {
    threadId: v.id("chatThreads"),
    limit: v.number(),
    cursor: v.optional(v.string())
  },
  handler: async (ctx, args): Promise<ChatMessagePage> => {
    const page = await ctx.db
      .query("chatMessages")
      .withIndex("by_threadId_createdAt", (query) => {
        const typedQuery = query as IndexRangeBuilder<
          ChatMessageRecord,
          ChatMessageIndexFields
        >;

        return typedQuery.eq("threadId", args.threadId);
      })
      .order("asc")
      .paginate({
        cursor: args.cursor ?? null,
        numItems: args.limit
      });

    const messages = orderChatMessages(
      page.page.map((message) => toChatMessageSummary(message as ChatMessageRecord))
    );

    return {
      messages: applyChatMessageLimit(messages, args.limit),
      nextCursor: page.continueCursor
    };
  }
});

const createChatMessage = mutationGeneric({
  args: {
    threadId: v.id("chatThreads"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    videoTimeSec: v.number(),
    timeWindow: v.object({
      startSec: v.number(),
      endSec: v.number()
    }),
    codeHash: v.optional(v.string())
  },
  handler: async (ctx, args): Promise<ChatMessageSummary> => {
    const thread = await ctx.db.get(args.threadId);

    if (!thread) {
      throw new Error("Chat thread not found.");
    }

    const createdAt = Date.now();

    const messageId = await ctx.db.insert("chatMessages", {
      threadId: args.threadId,
      role: args.role,
      content: args.content,
      videoTimeSec: args.videoTimeSec,
      timeWindowStartSec: args.timeWindow.startSec,
      timeWindowEndSec: args.timeWindow.endSec,
      codeHash: args.codeHash,
      createdAt
    });

    return {
      id: messageId,
      threadId: args.threadId,
      role: args.role,
      content: args.content,
      videoTimeSec: args.videoTimeSec,
      timeWindow: {
        startSec: args.timeWindow.startSec,
        endSec: args.timeWindow.endSec
      },
      codeHash: args.codeHash,
      createdAt
    };
  }
});

export { createChatMessage, ensureChatThread, getChatMessages, getChatThread };
