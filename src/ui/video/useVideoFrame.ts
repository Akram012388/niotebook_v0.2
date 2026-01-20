"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { FrameSummary } from "../../domain/resume";

type UseVideoFrameInput = {
  lessonId: string;
  threadId?: string;
  codeHash?: string;
};

const useVideoFrame = ({
  lessonId,
  threadId,
  codeHash,
}: UseVideoFrameInput): {
  frame: FrameSummary | null;
  updateFrame: (videoTimeSec: number) => Promise<void>;
} => {
  const isConvexEnabled = process.env.NEXT_PUBLIC_DISABLE_CONVEX !== "true";

  const getFrameRef = useMemo(
    () =>
      makeFunctionReference<"query">(
        "resume:getLatestFrame",
      ) as import("convex/server").FunctionReference<
        "query",
        "public",
        { lessonId: string },
        FrameSummary | null
      >,
    [],
  );

  const upsertFrameRef = useMemo(
    () =>
      makeFunctionReference<"mutation">(
        "resume:upsertFrame",
      ) as import("convex/server").FunctionReference<
        "mutation",
        "public",
        {
          lessonId: string;
          videoTimeSec: number;
          threadId?: string;
          codeHash?: string;
        },
        FrameSummary
      >,
    [],
  );

  const remoteFrame = useQuery(
    getFrameRef,
    isConvexEnabled ? { lessonId } : "skip",
  );
  const upsertFrame = useMutation(upsertFrameRef);

  const [localFrame, setLocalFrame] = useState<FrameSummary | null>(null);

  const frame = remoteFrame ?? localFrame;

  const updateFrame = useCallback(
    async (videoTimeSec: number): Promise<void> => {
      if (!isConvexEnabled) {
        setLocalFrame({
          id: "local-frame" as FrameSummary["id"],
          userId: "local-user" as FrameSummary["userId"],
          lessonId: lessonId as FrameSummary["lessonId"],
          videoTimeSec,
          threadId: threadId as FrameSummary["threadId"],
          codeHash,
          updatedAt: Date.now(),
        });
        return;
      }

      const updated = await upsertFrame({
        lessonId,
        videoTimeSec,
        threadId,
        codeHash,
      });

      setLocalFrame(updated);
    },
    [codeHash, isConvexEnabled, lessonId, threadId, upsertFrame],
  );

  return {
    frame,
    updateFrame,
  };
};

export { useVideoFrame };
