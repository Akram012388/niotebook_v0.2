import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const eventMetadata = v.object({
  inviteId: v.optional(v.id("invites")),
  createdBy: v.optional(v.id("users")),
  redeemedBy: v.optional(v.id("users")),
  emailHash: v.optional(v.string()),
  courseId: v.optional(v.id("courses")),
  lessonId: v.optional(v.id("lessons")),
  videoTimeSec: v.optional(v.number()),
  language: v.optional(v.string()),
  success: v.optional(v.boolean()),
  runtimeMs: v.optional(v.number()),
  threadId: v.optional(v.id("chatThreads")),
  latencyMs: v.optional(v.number()),
  completionPct: v.optional(v.number()),
  durationMs: v.optional(v.number()),
  segmentCount: v.optional(v.number()),
  transcriptDurationSec: v.optional(v.number()),
  lessonDurationSec: v.optional(v.number()),
  reason: v.optional(v.string()),
  surface: v.optional(v.string()),
  network: v.optional(v.string()),
  rating: v.optional(v.number()),
  textLength: v.optional(v.number())
});

const schema = defineSchema({
  courses: defineTable({
    sourcePlaylistId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    license: v.string(),
    sourceUrl: v.string()
  }),
  lessons: defineTable({
    courseId: v.id("courses"),
    videoId: v.string(),
    title: v.string(),
    durationSec: v.number(),
    order: v.number(),
    subtitlesUrl: v.optional(v.string()),
    transcriptUrl: v.optional(v.string()),
    transcriptDurationSec: v.optional(v.number()),
    segmentCount: v.optional(v.number()),
    ingestVersion: v.optional(v.number()),
    transcriptStatus: v.union(
      v.literal("ok"),
      v.literal("warn"),
      v.literal("missing"),
      v.literal("error")
    )
  }).index("by_courseId", ["courseId"]),
  chapters: defineTable({
    lessonId: v.id("lessons"),
    title: v.string(),
    startSec: v.number(),
    endSec: v.number()
  }).index("by_lessonId", ["lessonId"]),
  transcriptSegments: defineTable({
    lessonId: v.id("lessons"),
    idx: v.number(),
    startSec: v.number(),
    endSec: v.number(),
    textRaw: v.string(),
    textNormalized: v.string()
  })
    .index("by_lessonId_startSec", ["lessonId", "startSec"])
    .index("by_lessonId_idx", ["lessonId", "idx"]),
  users: defineTable({
    email: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user"), v.literal("guest")),
    inviteBatchId: v.optional(v.string())
  }).index("by_inviteBatchId", ["inviteBatchId"]),
  invites: defineTable({
    code: v.string(),
    createdBy: v.optional(v.id("users")),
    redeemedBy: v.optional(v.id("users")),
    status: v.union(v.literal("active"), v.literal("redeemed"), v.literal("expired")),
    createdAt: v.number(),
    expiresAt: v.number(),
    inviteBatchId: v.string()
  })
    .index("by_code", ["code"])
    .index("by_inviteBatchId", ["inviteBatchId"]),
  frames: defineTable({
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    videoTimeSec: v.number(),
    threadId: v.optional(v.id("chatThreads")),
    codeHash: v.optional(v.string()),
    updatedAt: v.number()
  }).index("by_userId_lessonId", ["userId", "lessonId"]),
  codeSnapshots: defineTable({
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    language: v.string(),
    code: v.string(),
    codeHash: v.string(),
    updatedAt: v.number()
  }).index("by_userId_lessonId_language", ["userId", "lessonId", "language"]),
  chatThreads: defineTable({
    userId: v.id("users"),
    lessonId: v.id("lessons")
  }).index("by_userId_lessonId", ["userId", "lessonId"]),
  chatMessages: defineTable({
    threadId: v.id("chatThreads"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    content: v.string(),
    videoTimeSec: v.optional(v.number()),
    timeWindowStartSec: v.optional(v.number()),
    timeWindowEndSec: v.optional(v.number()),
    codeHash: v.optional(v.string()),
    createdAt: v.number()
  })
    .index("by_threadId", ["threadId"])
    .index("by_threadId_createdAt", ["threadId", "createdAt"]),
  events: defineTable({
    userId: v.id("users"),
    lessonId: v.optional(v.id("lessons")),
    sessionId: v.optional(v.string()),
    type: v.string(),
    metadata: eventMetadata,
    createdAt: v.number()
  })
    .index("by_userId", ["userId"])
    .index("by_type_createdAt", ["type", "createdAt"]),
  rateLimits: defineTable({
    scope: v.union(v.literal("invite_redeem"), v.literal("ai_request")),
    subject: v.string(),
    windowStartMs: v.number(),
    count: v.number()
  }).index("by_scope_subject", ["scope", "subject"])
});

export default schema;
