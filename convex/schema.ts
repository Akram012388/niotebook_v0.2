import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  courses: defineTable({
    sourcePlaylistId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    license: v.string(),
    sourceUrl: v.string(),
    youtubePlaylistUrl: v.optional(v.string()),
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
      v.literal("error"),
    ),
    environmentConfig: v.optional(
      v.object({
        presetId: v.optional(v.string()),
        primaryLanguage: v.string(),
        allowedLanguages: v.array(v.string()),
        starterFiles: v.optional(
          v.array(
            v.object({
              path: v.string(),
              content: v.string(),
              readonly: v.boolean(),
            }),
          ),
        ),
        packages: v.optional(
          v.array(
            v.object({
              language: v.string(),
              name: v.string(),
              version: v.optional(v.string()),
            }),
          ),
        ),
        runtimeSettings: v.optional(
          v.object({
            timeoutMs: v.optional(v.number()),
            maxOutputBytes: v.optional(v.number()),
            stdinEnabled: v.optional(v.boolean()),
            compilerFlags: v.optional(v.array(v.string())),
          }),
        ),
      }),
    ),
  }).index("by_courseId", ["courseId"]),
  chapters: defineTable({
    lessonId: v.id("lessons"),
    title: v.string(),
    startSec: v.number(),
    endSec: v.number(),
  }).index("by_lessonId", ["lessonId"]),
  transcriptSegments: defineTable({
    lessonId: v.id("lessons"),
    idx: v.number(),
    startSec: v.number(),
    endSec: v.number(),
    textRaw: v.string(),
    textNormalized: v.string(),
  })
    .index("by_lessonId_startSec", ["lessonId", "startSec"])
    .index("by_lessonId_idx", ["lessonId", "idx"]),
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user")),
    activeAiProvider: v.optional(
      v.union(v.literal("gemini"), v.literal("openai"), v.literal("anthropic")),
    ),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),
  userApiKeys: defineTable({
    userId: v.id("users"),
    provider: v.union(
      v.literal("gemini"),
      v.literal("openai"),
      v.literal("anthropic"),
    ),
    encryptedKey: v.string(),
    iv: v.string(),
    keyHint: v.string(),
    updatedAt: v.number(),
  }).index("by_userId_provider", ["userId", "provider"]),
  frames: defineTable({
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    videoTimeSec: v.number(),
    threadId: v.optional(v.id("chatThreads")),
    codeHash: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_userId_lessonId", ["userId", "lessonId"])
    .index("by_updatedAt", ["updatedAt"]),
  lessonCompletions: defineTable({
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    completionMethod: v.union(v.literal("video"), v.literal("code")),
    completionPct: v.optional(v.number()),
    completedAt: v.number(),
  }).index("by_userId_lessonId", ["userId", "lessonId"]),
  codeSnapshots: defineTable({
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    language: v.string(),
    code: v.string(),
    codeHash: v.string(),
    updatedAt: v.number(),
  }).index("by_userId_lessonId_language", ["userId", "lessonId", "language"]),
  chatThreads: defineTable({
    userId: v.id("users"),
    lessonId: v.id("lessons"),
  }).index("by_userId_lessonId", ["userId", "lessonId"]),
  chatMessages: defineTable({
    threadId: v.id("chatThreads"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system"),
    ),
    content: v.string(),
    videoTimeSec: v.optional(v.number()),
    timeWindowStartSec: v.optional(v.number()),
    timeWindowEndSec: v.optional(v.number()),
    codeHash: v.optional(v.string()),
    requestId: v.optional(v.string()),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    latencyMs: v.optional(v.number()),
    usedFallback: v.optional(v.boolean()),
    contextHash: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_threadId", ["threadId"])
    .index("by_threadId_createdAt", ["threadId", "createdAt"])
    .index("by_threadId_requestId", ["threadId", "requestId"]),
  events: defineTable({
    userId: v.optional(v.id("users")),
    lessonId: v.optional(v.id("lessons")),
    sessionId: v.optional(v.string()),
    type: v.string(),
    metadata: v.object({
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
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_type_createdAt", ["type", "createdAt"])
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_lessonId_createdAt", ["lessonId", "createdAt"]),
  feedback: defineTable({
    userId: v.id("users"),
    category: v.string(),
    rating: v.number(),
    notes: v.optional(v.string()),
    lessonId: v.optional(v.id("lessons")),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
  rateLimits: defineTable({
    scope: v.union(
      v.literal("ai_request"),
      v.literal("event_log"),
      v.literal("feedback"),
    ),
    subject: v.string(),
    windowStartMs: v.number(),
    count: v.number(),
  })
    .index("by_scope_subject", ["scope", "subject"])
    .index("by_windowStartMs", ["windowStartMs"]),
});

export default schema;
