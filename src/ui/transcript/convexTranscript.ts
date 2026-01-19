import { makeFunctionReference } from "convex/server";
import type { TranscriptWindowSegment } from "../../domain/transcript";

type TranscriptWindowReference = import("convex/server").FunctionReference<
  "query",
  "public",
  { lessonId: string; startSec: number; endSec: number },
  TranscriptWindowSegment[]
>;

const getTranscriptWindowRef = makeFunctionReference<"query">(
  "transcripts:getTranscriptWindow",
) as TranscriptWindowReference;

export { getTranscriptWindowRef };
