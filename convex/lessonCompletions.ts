import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import {
  resolveLessonCompletionSummary,
  type LessonCompletionSummary,
  type LessonCompletionUpsertInput,
} from "../src/domain/lesson-completions";
import { requireMutationUser, requireQueryUser } from "./auth";
import { logEventInternal } from "./events";
import { toDomainId, toGenericId } from "./idUtils";

type LessonCompletionIndexFields = ["userId", "lessonId"];

type LessonCompletionRecord = {
  _id: GenericId<"lessonCompletions">;
  _creationTime: number;
  userId: GenericId<"users">;
  lessonId: GenericId<"lessons">;
  completionMethod: "video" | "code";
  completionPct?: number;
  completedAt: number;
};

type SetLessonCompletedArgs = {
  lessonId: GenericId<"lessons">;
  completionMethod: "video" | "code";
  completionPct?: number;
};

type SetLessonCompletedResult = ReturnType<
  typeof resolveLessonCompletionSummary
>;

const setLessonCompleted = mutation({
  args: {
    lessonId: v.id("lessons"),
    completionMethod: v.union(v.literal("video"), v.literal("code")),
    completionPct: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args: SetLessonCompletedArgs,
  ): Promise<SetLessonCompletedResult> => {
    const user = await requireMutationUser(ctx);
    const existing = (await ctx.db
      .query("lessonCompletions")
      .withIndex("by_userId_lessonId", (query) => {
        const typedQuery =
          query as unknown as import("convex/server").IndexRangeBuilder<
            LessonCompletionRecord,
            LessonCompletionIndexFields
          >;

        return typedQuery
          .eq("userId", toGenericId(user.id))
          .eq("lessonId", args.lessonId);
      })
      .first()) as LessonCompletionRecord | null;

    const completedAt = Date.now();
    const summaryInput: LessonCompletionUpsertInput = {
      userId: toDomainId(toGenericId(user.id)),
      lessonId: toDomainId(args.lessonId),
      completionMethod: args.completionMethod,
      completionPct: args.completionPct,
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        completionMethod: args.completionMethod,
        completionPct: args.completionPct,
        completedAt,
      });

      const summary = resolveLessonCompletionSummary(
        toDomainId(existing._id as GenericId<"lessonCompletions">),
        summaryInput,
        completedAt,
      );

      await logEventInternal(ctx, {
        eventType: "lesson_completed",
        lessonId: args.lessonId,
        metadata: {
          lessonId: args.lessonId,
          completionPct: args.completionPct,
        },
        userId: toGenericId(user.id),
      });

      return summary;
    }

    const completionId = await ctx.db.insert("lessonCompletions", {
      userId: toGenericId(user.id),
      lessonId: args.lessonId,
      completionMethod: args.completionMethod,
      completionPct: args.completionPct,
      completedAt,
    });

    const summary = resolveLessonCompletionSummary(
      toDomainId(completionId as GenericId<"lessonCompletions">),
      summaryInput,
      completedAt,
    );

    await logEventInternal(ctx, {
      eventType: "lesson_completed",
      lessonId: args.lessonId,
      metadata: {
        lessonId: args.lessonId,
        completionPct: args.completionPct,
      },
      userId: toGenericId(user.id),
    });

    return summary;
  },
});

const getCompletionsByCourse = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args): Promise<LessonCompletionSummary[]> => {
    const user = await requireQueryUser(ctx);

    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();

    const completions: LessonCompletionSummary[] = [];

    for (const lesson of lessons) {
      const completion = (await ctx.db
        .query("lessonCompletions")
        .withIndex("by_userId_lessonId", (q) => {
          const typed =
            q as unknown as import("convex/server").IndexRangeBuilder<
              LessonCompletionRecord,
              LessonCompletionIndexFields
            >;
          return typed
            .eq("userId", toGenericId(user.id))
            .eq("lessonId", lesson._id);
        })
        .first()) as LessonCompletionRecord | null;

      if (completion) {
        completions.push({
          id: toDomainId(completion._id as GenericId<"lessonCompletions">),
          userId: toDomainId(toGenericId(user.id)),
          lessonId: toDomainId(completion.lessonId as GenericId<"lessons">),
          completionMethod: completion.completionMethod,
          completionPct: completion.completionPct,
          completedAt: completion.completedAt,
        });
      }
    }

    return completions;
  },
});

export { getCompletionsByCourse, setLessonCompleted };
