import { ConvexHttpClient } from "convex/browser";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { resolveLectureNumber } from "../../domain/lectureNumber";

const isConvexEnabled = (): boolean => {
  return process.env.NEXT_PUBLIC_DISABLE_CONVEX !== "true";
};

function toLessonId(id: string): Id<"lessons"> {
  return id as Id<"lessons">;
}

const fetchTranscriptWindow = async (args: {
  lessonId: string;
  startSec: number;
  endSec: number;
  client: ConvexHttpClient;
}): Promise<string[]> => {
  if (!isConvexEnabled()) {
    return [];
  }

  const segments = await args.client.query(
    api.transcripts.getTranscriptWindow,
    {
      lessonId: toLessonId(args.lessonId),
      startSec: args.startSec,
      endSec: args.endSec,
    },
  );

  return segments.map((segment) => segment.textNormalized);
};

const fetchLessonMeta = async (args: {
  lessonId: string;
  client: ConvexHttpClient;
}): Promise<{
  title?: string;
  order?: number;
  lectureNumber?: number;
  subtitlesUrl?: string;
  transcriptUrl?: string;
  videoId?: string;
} | null> => {
  if (!isConvexEnabled()) {
    return null;
  }

  const lesson = await args.client.query(api.content.getLesson, {
    lessonId: toLessonId(args.lessonId),
  });

  if (!lesson) {
    return null;
  }

  const lectureNumber = resolveLectureNumber({
    subtitlesUrl: lesson.subtitlesUrl,
    transcriptUrl: lesson.transcriptUrl,
    title: lesson.title,
    order: lesson.order,
  });

  return {
    title: lesson.title,
    order: lesson.order,
    lectureNumber: lectureNumber ?? undefined,
    subtitlesUrl: lesson.subtitlesUrl,
    transcriptUrl: lesson.transcriptUrl,
    videoId: lesson.videoId,
  };
};

export { fetchTranscriptWindow, fetchLessonMeta };
