import { mutation } from "./_generated/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import {
  validateEventMetadata,
  validateEventUserId,
  type EventLogResult,
} from "../src/domain/events";
import { requireMutationUser } from "./auth";
import { toGenericId, toDomainId } from "./idUtils";

type MutationDefinition = Parameters<typeof mutation>[0];

type MutationConfig = Extract<
  MutationDefinition,
  { handler: (...args: never[]) => unknown }
>;

type MutationCtx = Parameters<MutationConfig["handler"]>[0];

type EventMetadataInput = Parameters<typeof validateEventMetadata>[1];

type EventType = Parameters<typeof validateEventMetadata>[0];

type LogEventInternalArgs = {
  eventType: EventType;
  lessonId?: GenericId<"lessons">;
  sessionId?: string;
  metadata: EventMetadataInput;
};

const logEvent = mutation({
  args: {
    eventType: v.union(
      v.literal("invite_issued"),
      v.literal("invite_redeemed"),
      v.literal("magic_link_sent"),
      v.literal("magic_link_verified"),
      v.literal("course_selected"),
      v.literal("lesson_started"),
      v.literal("video_play"),
      v.literal("video_pause"),
      v.literal("video_seek"),
      v.literal("code_edit"),
      v.literal("code_run"),
      v.literal("nio_message_sent"),
      v.literal("nio_message_received"),
      v.literal("ai_fallback_triggered"),
      v.literal("lesson_completed"),
      v.literal("session_start"),
      v.literal("session_end"),
      v.literal("runtime_warmup_start"),
      v.literal("runtime_warmup_end"),
      v.literal("transcript_ingest_started"),
      v.literal("transcript_ingest_succeeded"),
      v.literal("transcript_ingest_failed"),
      v.literal("transcript_duration_warn"),
      v.literal("share_opened"),
      v.literal("share_copy"),
      v.literal("share_social"),
      v.literal("feedback_opened"),
      v.literal("feedback_submitted"),
      v.literal("feedback_dismissed"),
    ),
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
