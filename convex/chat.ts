import { query, mutation } from "./_generated/server";
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
  type ChatTimeWindow,
} from "../src/domain/chat";
import { requireMutationUser, requireQueryUser } from "./auth";
import { logEventInternal } from "./events";
import { toDomainId, toGenericId } from "./idUtils";

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
  videoTimeSec?: number;
  timeWindowStartSec?: number;
  timeWindowEndSec?: number;
  codeHash?: string;
  requestId?: string;
  provider?: string;
  model?: string;
  latencyMs?: number;
  usedFallback?: boolean;
  contextHash?: string;
  createdAt: number;
};

const toChatThreadSummary = (thread: ChatThreadRecord): ChatThreadSummary => {
  return {
    id: toDomainId(thread._id as GenericId<"chatThreads">),
    userId: toDomainId(thread.userId as GenericId<"users">),
    lessonId: toDomainId(thread.lessonId as GenericId<"lessons">),
  };
};

const toChatMessageSummary = (
  message: ChatMessageRecord,
): ChatMessageSummary => {
  const timeWindow: ChatTimeWindow = {
    startSec: message.timeWindowStartSec ?? 0,
    endSec: message.timeWindowEndSec ?? 0,
  };

  return {
    id: toDomainId(message._id as GenericId<"chatMessages">),
    threadId: toDomainId(message.threadId as GenericId<"chatThreads">),
    role: message.role,
    content: message.content,
    videoTimeSec: message.videoTimeSec ?? 0,
    timeWindow,
    codeHash: message.codeHash,
    requestId: message.requestId,
    provider: message.provider,
    model: message.model,
    latencyMs: message.latencyMs,
    usedFallback: message.usedFallback,
    contextHash: message.contextHash,
    createdAt: message.createdAt,
  };
};

const getChatThread = query({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args): Promise<ChatThreadSummary | null> => {
    let user;
    try {
      user = await requireQueryUser(ctx);
    } catch {
      return null;
    }

    const thread = (await ctx.db
      .query("chatThreads")
      .withIndex("by_userId_lessonId", (query) =>
        query.eq("userId", toGenericId(user.id)).eq("lessonId", args.lessonId),
      )
      .first()) as ChatThreadRecord | null;

    return thread ? toChatThreadSummary(thread) : null;
  },
});

const ensureChatThread = mutation({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args): Promise<GenericId<"chatThreads">> => {
    const user = await requireMutationUser(ctx);

    const existing = (await ctx.db
      .query("chatThreads")
      .withIndex("by_userId_lessonId", (query) =>
        query.eq("userId", toGenericId(user.id)).eq("lessonId", args.lessonId),
      )
      .first()) as ChatThreadRecord | null;

    const resolution = resolveChatThreadResolution(
      existing ? toDomainId(existing._id as GenericId<"chatThreads">) : null,
    );

    if (!resolution.shouldCreate && resolution.threadId) {
      return toGenericId(resolution.threadId);
    }

    return ctx.db.insert("chatThreads", {
      userId: toGenericId(user.id),
      lessonId: args.lessonId,
    });
  },
});

const getChatMessages = query({
  args: {
    threadId: v.id("chatThreads"),
    limit: v.number(),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<ChatMessagePage> => {
    let user;
    try {
      user = await requireQueryUser(ctx);
    } catch {
      return { messages: [], nextCursor: null };
    }
    const thread = (await ctx.db.get(args.threadId)) as ChatThreadRecord | null;

    if (!thread || thread.userId !== toGenericId(user.id)) {
      throw new Error("Chat thread not accessible.");
    }

    const limit = Math.min(args.limit, 100);

    const page = await ctx.db
      .query("chatMessages")
      .withIndex("by_threadId_createdAt", (query) =>
        query.eq("threadId", args.threadId),
      )
      .order("desc")
      .paginate({
        cursor: args.cursor ?? null,
        numItems: limit,
      });

    const messages = orderChatMessages(
      page.page.map((message) =>
        toChatMessageSummary(message as ChatMessageRecord),
      ),
    );

    return {
      messages: applyChatMessageLimit(messages, limit),
      nextCursor: page.continueCursor,
    };
  },
});

const createChatMessage = mutation({
  args: {
    threadId: v.id("chatThreads"),
    role: v.literal("user"),
    content: v.string(),
    videoTimeSec: v.number(),
    timeWindow: v.object({
      startSec: v.number(),
      endSec: v.number(),
    }),
    codeHash: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<ChatMessageSummary> => {
    const user = await requireMutationUser(ctx);
    const thread = (await ctx.db.get(args.threadId)) as ChatThreadRecord | null;

    if (!thread || thread.userId !== toGenericId(user.id)) {
      throw new Error("Chat thread not accessible.");
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
      createdAt,
    });

    return {
      id: toDomainId(messageId as GenericId<"chatMessages">),
      threadId: toDomainId(args.threadId as GenericId<"chatThreads">),
      role: args.role,
      content: args.content,
      videoTimeSec: args.videoTimeSec,
      timeWindow: {
        startSec: args.timeWindow.startSec,
        endSec: args.timeWindow.endSec,
      },
      codeHash: args.codeHash,
      createdAt,
    };
  },
});

const completeAssistantMessage = mutation({
  args: {
    threadId: v.id("chatThreads"),
    requestId: v.string(),
    content: v.string(),
    videoTimeSec: v.number(),
    timeWindow: v.object({
      startSec: v.number(),
      endSec: v.number(),
    }),
    codeHash: v.optional(v.string()),
    provider: v.string(),
    model: v.string(),
    latencyMs: v.number(),
    usedFallback: v.boolean(),
    contextHash: v.string(),
  },
  handler: async (ctx, args): Promise<ChatMessageSummary> => {
    const user = await requireMutationUser(ctx);
    const thread = (await ctx.db.get(args.threadId)) as ChatThreadRecord | null;

    if (!thread || thread.userId !== toGenericId(user.id)) {
      throw new Error("Chat thread not accessible.");
    }

    const existing = (await ctx.db
      .query("chatMessages")
      .withIndex("by_threadId_requestId", (query) =>
        query.eq("threadId", args.threadId).eq("requestId", args.requestId),
      )
      .first()) as ChatMessageRecord | null;

    if (existing) {
      return toChatMessageSummary(existing);
    }

    const createdAt = Date.now();
    const messageId = await ctx.db.insert("chatMessages", {
      threadId: args.threadId,
      role: "assistant",
      content: args.content,
      videoTimeSec: args.videoTimeSec,
      timeWindowStartSec: args.timeWindow.startSec,
      timeWindowEndSec: args.timeWindow.endSec,
      codeHash: args.codeHash,
      requestId: args.requestId,
      provider: args.provider,
      model: args.model,
      latencyMs: args.latencyMs,
      usedFallback: args.usedFallback,
      contextHash: args.contextHash,
      createdAt,
    });

    {
      const result = await logEventInternal(ctx, {
        eventType: "nio_message_received",
        lessonId: thread.lessonId,
        metadata: {
          lessonId: toDomainId(thread.lessonId as GenericId<"lessons">),
          threadId: toDomainId(args.threadId as GenericId<"chatThreads">),
          latencyMs: args.latencyMs,
        },
        userId: toGenericId(user.id),
      });

      if (!result.ok) {
        console.error(
          "[events] logEventInternal failed",
          result.error.code,
          result.error.message,
          { eventType: "nio_message_received" },
        );
      }
    }

    return {
      id: toDomainId(messageId as GenericId<"chatMessages">),
      threadId: toDomainId(args.threadId as GenericId<"chatThreads">),
      role: "assistant",
      content: args.content,
      videoTimeSec: args.videoTimeSec,
      timeWindow: {
        startSec: args.timeWindow.startSec,
        endSec: args.timeWindow.endSec,
      },
      codeHash: args.codeHash,
      requestId: args.requestId,
      provider: args.provider,
      model: args.model,
      latencyMs: args.latencyMs,
      usedFallback: args.usedFallback,
      contextHash: args.contextHash,
      createdAt,
    };
  },
});

export {
  completeAssistantMessage,
  createChatMessage,
  ensureChatThread,
  getChatMessages,
  getChatThread,
};
