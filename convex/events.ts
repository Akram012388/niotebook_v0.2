import { mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { GenericId } from "convex/values";
import {
  EVENT_TYPES,
  validateEventMetadata,
  validateEventUserId,
  type EventLogResult,
} from "../src/domain/events";
import { requireMutationUser } from "./auth";
import { toGenericId, toDomainId } from "./idUtils";
import { consumeEventLogRateLimit } from "./rateLimits";
import type { MutationCtx } from "./lib/mutationCtx";

type EventMetadataInput = Parameters<typeof validateEventMetadata>[1];

type EventType = Parameters<typeof validateEventMetadata>[0];

type LogEventInternalArgs = {
  eventType: EventType;
  lessonId?: GenericId<"lessons">;
  sessionId?: string;
  metadata: EventMetadataInput;
};

// Event type source of truth: src/domain/events.ts EVENT_TYPES
const [first, second, ...rest] = EVENT_TYPES.map((t) => v.literal(t));
const eventTypeValidator = v.union(first, second, ...rest);

const logEvent = mutation({
  args: {
    eventType: eventTypeValidator,
    lessonId: v.optional(v.id("lessons")),
    sessionId: v.optional(v.string()),
    metadata: v.object({
      inviteId: v.optional(v.string()),
      createdBy: v.optional(v.id("users")),
      redeemedBy: v.optional(v.id("users")),
      userId: v.optional(v.id("users")),
      emailHash: v.optional(v.string()),
      courseId: v.optional(v.id("courses")),
      lessonId: v.optional(v.id("lessons")),
      videoTimeSec: v.optional(v.number()),
      language: v.optional(v.string()),
      success: v.optional(v.boolean()),
      runtimeMs: v.optional(v.number()),
      threadId: v.optional(v.id("chatThreads")),
      fromProvider: v.optional(v.string()),
      toProvider: v.optional(v.string()),
      latencyMs: v.optional(v.number()),
      completionPct: v.optional(v.number()),
      sessionId: v.optional(v.string()),
      durationMs: v.optional(v.number()),
      segmentCount: v.optional(v.number()),
      transcriptDurationSec: v.optional(v.number()),
      lessonDurationSec: v.optional(v.number()),
      reason: v.optional(v.string()),
      surface: v.optional(v.string()),
      network: v.optional(v.string()),
      rating: v.optional(v.number()),
      textLength: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args): Promise<EventLogResult> => {
    const user = await requireMutationUser(ctx);

    const rateLimit = await consumeEventLogRateLimit(ctx, user.id);
    if (!rateLimit.ok) {
      throw new ConvexError({
        code: "rate_limit_exceeded",
        resetAtMs: rateLimit.resetAtMs,
      });
    }

    return logEventInternal(ctx, {
      eventType: args.eventType,
      lessonId: args.lessonId,
      sessionId: args.sessionId,
      metadata: args.metadata,
      userId: toGenericId(user.id),
    });
  },
});

const logEventInternal = async (
  ctx: MutationCtx,
  args: LogEventInternalArgs & { userId?: GenericId<"users"> },
): Promise<EventLogResult> => {
  const userValidation = validateEventUserId(
    args.userId ? toDomainId(args.userId) : undefined,
  );

  if (!userValidation.ok) {
    return userValidation;
  }

  const validation = validateEventMetadata(args.eventType, args.metadata);

  if (!validation.ok) {
    return validation;
  }

  const createdAt = Date.now();
  const eventId = await ctx.db.insert("events", {
    userId: args.userId,
    lessonId: args.lessonId,
    sessionId: args.sessionId,
    type: args.eventType,
    metadata: args.metadata,
    createdAt,
  });

  return {
    ok: true,
    eventId: toDomainId(eventId as GenericId<"events">),
  };
};

export { logEvent, logEventInternal };
