import { mutation } from "./_generated/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import { toDomainId } from "./idUtils";

const ensureIngestToken = (ingestToken: string): void => {
  const expected = process.env.NIOTEBOOK_INGEST_TOKEN;
  if (!expected) {
    throw new Error("NIOTEBOOK_INGEST_TOKEN is not configured.");
  }
  if (ingestToken !== expected) {
    throw new Error("Invalid ingest token.");
  }
};

type UserRecord = {
  _id: GenericId<"users">;
  tokenIdentifier: string;
};

type ChatThreadRecord = {
  _id: GenericId<"chatThreads">;
  userId: GenericId<"users">;
  lessonId: GenericId<"lessons">;
};

type LessonRecord = {
  _id: GenericId<"lessons">;
  order: number;
  videoId: string;
  transcriptStatus?: "ok" | "warn" | "missing" | "error";
};

const seedE2E = mutation({
  args: {
    ingestToken: v.string(),
    videoId: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ lessonId: string; threadId: string }> => {
    if (process.env.NIOTEBOOK_PREVIEW_DATA !== "true") {
      throw new Error("E2E seed is only allowed in preview-data.");
    }

    ensureIngestToken(args.ingestToken);

    const user = (await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (query) =>
        query.eq("tokenIdentifier", "e2e-preview"),
      )
      .first()) as UserRecord | null;

    const userId = user
      ? user._id
      : await ctx.db.insert("users", {
          tokenIdentifier: "e2e-preview",
          email: "e2e@niotebook.local",
          role: "admin",
        });

    const existingCourse = (await ctx.db.query("courses").collect()).find(
      (course) => course.sourcePlaylistId === "e2e-preview",
    );

    const courseId = existingCourse
      ? existingCourse._id
      : await ctx.db.insert("courses", {
          sourcePlaylistId: "e2e-preview",
          title: "CS50x E2E",
          description: "Seeded for preview E2E runs.",
          license: "MIT",
          sourceUrl: "https://example.com",
        });

    const existingLessons = (await ctx.db
      .query("lessons")
      .withIndex("by_courseId", (query) => query.eq("courseId", courseId))
      .collect()) as LessonRecord[];
    const existingLesson = existingLessons.find(
      (lesson) => lesson.videoId === args.videoId,
    );

    const lessonId = existingLesson
      ? existingLesson._id
      : await ctx.db.insert("lessons", {
          courseId,
          videoId: args.videoId,
          title: "E2E lesson",
          durationSec: 3600,
          order: 1,
          transcriptStatus: "missing",
        });

    const existingThread = (await ctx.db
      .query("chatThreads")
      .withIndex("by_userId_lessonId", (query) =>
        query.eq("userId", userId).eq("lessonId", lessonId),
      )
      .first()) as ChatThreadRecord | null;

    const threadId = existingThread
      ? existingThread._id
      : await ctx.db.insert("chatThreads", {
          userId,
          lessonId,
        });

    await ctx.db.insert("chatMessages", {
      threadId,
      role: "user",
      content: "hello e2e",
      videoTimeSec: 0,
      timeWindowStartSec: 0,
      timeWindowEndSec: 60,
      createdAt: Date.now(),
    });

    return {
      lessonId: toDomainId(lessonId),
      threadId: toDomainId(threadId as GenericId<"chatThreads">),
    };
  },
});

export { seedE2E };
