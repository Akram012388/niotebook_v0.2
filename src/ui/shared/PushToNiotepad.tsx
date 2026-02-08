"use client";

import { memo, useCallback, useState, type ReactElement } from "react";
import { useNiotepadStore } from "../../infra/niotepad/useNiotepadStore";
import type { NiotepadEntrySource, NiotepadEntry } from "../../domain/niotepad";

type PushToNiotepadProps = {
  content: string;
  source: NiotepadEntrySource;
  lessonId: string;
  videoTimeSec?: number | null;
  metadata?: NiotepadEntry["metadata"];
  className?: string;
};

const PushToNiotepad = memo(function PushToNiotepad({
  content,
  source,
  lessonId,
  videoTimeSec = null,
  metadata = {},
  className = "",
}: PushToNiotepadProps): ReactElement {
  const [pushed, setPushed] = useState(false);

  const handlePush = useCallback(() => {
    useNiotepadStore.getState().addEntry({
      content,
      source,
      lessonId,
      videoTimeSec: videoTimeSec ?? null,
      metadata,
    });
    setPushed(true);
    setTimeout(() => setPushed(false), 1500);
  }, [content, source, lessonId, videoTimeSec, metadata]);

  return (
    <button
      type="button"
      onClick={handlePush}
      className={`text-xs text-text-muted transition-all hover:text-accent ${className}`}
      aria-label="Push to Niotepad"
    >
      {pushed ? "\u2713" : "\uD83D\uDCCC"}
    </button>
  );
});

export { PushToNiotepad };
