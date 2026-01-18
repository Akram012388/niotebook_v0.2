import { query } from "./_generated/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import {
  TRANSCRIPT_START_PAD_SEC,
  toTranscriptWindowSegments,
  type TranscriptSegment,
  type TranscriptWindowSegment,
} from "../src/domain/transcript";
import { requireQueryWorkspaceUser } from "./auth";
import { toDomainId } from "./idUtils";

type TranscriptSegmentRecord = {
  _id: GenericId<"transcriptSegments">;
  _creationTime: number;
  lessonId: GenericId<"lessons">;
  idx: number;
  startSec: number;
  endSec: number;
  textRaw: string;
  textNormalized: string;
};

const toTranscriptSegment = (
  segment: TranscriptSegmentRecord,
): TranscriptSegment => {
  return {
    lessonId: toDomainId(segment.lessonId as GenericId<"lessons">),
    idx: segment.idx,
    startSec: segment.startSec,
    endSec: segment.endSec,
    textNormalized: segment.textNormalized,
  };
};

const getTranscriptWindow = query({
  args: {
    lessonId: v.id("lessons"),
    startSec: v.number(),
    endSec: v.number(),
  },
  handler: async (ctx, args): Promise<TranscriptWindowSegment[]> => {
    await requireQueryWorkspaceUser(ctx);

    const lowerBound = Math.max(0, args.startSec - TRANSCRIPT_START_PAD_SEC);

    const segments = (await ctx.db
      .query("transcriptSegments")
      .withIndex("by_lessonId_startSec", (query) =>
        query
          .eq("lessonId", args.lessonId)
          .gte("startSec", lowerBound)
          .lte("startSec", args.endSec),
      )
      .collect()) as TranscriptSegmentRecord[];

    return toTranscriptWindowSegments(
      segments.map(toTranscriptSegment),
      args.startSec,
      args.endSec,
    );
  },
});

export { getTranscriptWindow };
