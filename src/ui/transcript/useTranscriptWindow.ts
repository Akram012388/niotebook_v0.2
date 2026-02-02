import { useMemo } from "react";
import { useQuery } from "convex/react";
import type { TranscriptWindowSegment } from "../../domain/transcript";
import {
  cacheTranscriptWindowMemory,
  getCachedTranscriptWindowMemory,
} from "../../infra/transcriptWindowCache";
import { getTranscriptWindowRef } from "./convexTranscript";

const WINDOW_PRE_SEC = 60;
const WINDOW_POST_SEC = 60;

type TranscriptWindowState = {
  segments: TranscriptWindowSegment[];
  startSec: number;
  endSec: number;
};

const useTranscriptWindow = (
  lessonId: string,
  currentTimeSec: number,
): TranscriptWindowState => {
  const isConvexEnabled = process.env.NEXT_PUBLIC_DISABLE_CONVEX !== "true";
  const startSec = Math.max(0, currentTimeSec - WINDOW_PRE_SEC);
  const endSec = currentTimeSec + WINDOW_POST_SEC;

  const remoteSegments = useQuery(
    getTranscriptWindowRef,
    isConvexEnabled
      ? {
          lessonId,
          startSec,
          endSec,
        }
      : "skip",
  );

  const cached = useMemo(
    () => getCachedTranscriptWindowMemory(lessonId),
    [lessonId],
  );

  if (remoteSegments && remoteSegments.length > 0) {
    cacheTranscriptWindowMemory(lessonId, startSec, endSec, remoteSegments);
    return { segments: remoteSegments, startSec, endSec };
  }

  if (remoteSegments !== undefined && remoteSegments.length === 0) {
    console.warn("[transcript] getTranscriptWindow returned 0 segments", {
      lessonId,
      startSec,
      endSec,
    });
  }

  if (cached) {
    return {
      segments: cached.segments,
      startSec: cached.startSec,
      endSec: cached.endSec,
    };
  }

  return { segments: [], startSec, endSec };
};

export { useTranscriptWindow };
