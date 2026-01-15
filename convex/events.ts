import { mutationGeneric } from "convex/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import {
  validateEventMetadata,
  type EventLogResult,
  type EventType
} from "../src/domain/events";

type EventMetadataInput = {
  lessonId?: GenericId<"lessons">;
  segmentCount?: number;
  transcriptDurationSec?: number;
  reason?: string;
  lessonDurationSec?: number;
  inviteId?: GenericId<"invites">;
  inviteBatchId?: string;
  role?: "user" | "admin";
  scope?: "invite_redeem" | "ai_request";
  limit?: number;
  windowMs?: number;
  status?: number;
  timeoutMs?: number;
  completionPct?: number;
  intervalMs?: number;
};

const logEvent = mutationGeneric({
  args: {
    eventType: v.union(
      v.literal("transcript_ingest_started"),
      v.literal("transcript_ingest_succeeded"),
      v.literal("transcript_ingest_failed"),
      v.literal("transcript_duration_warn"),
      v.literal("invite_created"),
      v.literal("invite_redeemed"),
      v.literal("rate_limit_denied"),
      v.literal("ai_fallback_triggered"),
      v.literal("lesson_completed"),
      v.literal("session_heartbeat")
    ),
    userId: v.optional(v.id("users")),
    lessonId: v.optional(v.id("lessons")),
    sessionId: v.optional(v.string()),
    metadata: v.object({
      lessonId: v.optional(v.id("lessons")),
      segmentCount: v.optional(v.number()),
      transcriptDurationSec: v.optional(v.number()),
      reason: v.optional(v.string()),
      lessonDurationSec: v.optional(v.number()),
      inviteId: v.optional(v.id("invites")),
      inviteBatchId: v.optional(v.string()),
      role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
      scope: v.optional(v.union(v.literal("invite_redeem"), v.literal("ai_request"))),
      limit: v.optional(v.number()),
      windowMs: v.optional(v.number()),
      status: v.optional(v.number()),
      timeoutMs: v.optional(v.number()),
      completionPct: v.optional(v.number()),
      intervalMs: v.optional(v.number())
    })
  },
  handler: async (ctx, args): Promise<EventLogResult> => {
    const validation = validateEventMetadata(
      args.eventType as EventType,
      args.metadata as Record<string, unknown>
    );

    if (!validation.ok) {
      return validation;
    }

    const createdAt = Date.now();
    const eventId = await ctx.db.insert("events", {
      userId: args.userId,
      lessonId: args.lessonId,
      sessionId: args.sessionId,
      type: args.eventType,
      metadata: args.metadata as EventMetadataInput,
      createdAt
    });

    return {
      ok: true,
      eventId
    };
  }
});

export { logEvent };
