import { mutation } from "./_generated/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import {
  resolveLessonCompletionSummary,
  type LessonCompletionUpsertInput,
} from "../src/domain/lesson-completions";
import { requireMutationUser } from "./auth";
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
    });

    return summary;
  },
});

export { setLessonCompleted };
