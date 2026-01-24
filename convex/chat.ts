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
  videoTimeSec: number;
  timeWindowStartSec: number;
  timeWindowEndSec: number;
  codeHash?: string;
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
    startSec: message.timeWindowStartSec,
    endSec: message.timeWindowEndSec,
  };

  return {
    id: toDomainId(message._id as GenericId<"chatMessages">),
    threadId: toDomainId(message.threadId as GenericId<"chatThreads">),
    role: message.role,
    content: message.content,
    videoTimeSec: message.videoTimeSec,
    timeWindow,
    codeHash: message.codeHash,
    createdAt: message.createdAt,
  };
};

const getChatThread = query({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args): Promise<ChatThreadSummary | null> => {
    const user = await requireQueryUser(ctx);

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
    const user = await requireQueryUser(ctx);
    const thread = (await ctx.db.get(args.threadId)) as ChatThreadRecord | null;

    if (!thread || thread.userId !== toGenericId(user.id)) {
      throw new Error("Chat thread not accessible.");
    }

    const page = await ctx.db
      .query("chatMessages")
      .withIndex("by_threadId_createdAt", (query) =>
        query.eq("threadId", args.threadId),
      )
      .order("desc")
      .paginate({
        cursor: args.cursor ?? null,
        numItems: args.limit,
      });

    const messages = orderChatMessages(
      page.page.map((message) =>
        toChatMessageSummary(message as ChatMessageRecord),
      ),
    );

    return {
      messages: applyChatMessageLimit(messages, args.limit),
      nextCursor: page.continueCursor,
    };
  },
});

const createChatMessage = mutation({
  args: {
    threadId: v.id("chatThreads"),
    role: v.union(v.literal("user"), v.literal("assistant")),
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

export { createChatMessage, ensureChatThread, getChatMessages, getChatThread };
