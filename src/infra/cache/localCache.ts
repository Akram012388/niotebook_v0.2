import type { CodeSnapshotSummary, FrameSummary } from "../../domain/resume";
import { storageAdapter } from "../storageAdapter";

const cacheFrame = (lessonId: string, frame: FrameSummary): void => {
  storageAdapter.setItem(`niotebook.frame.${lessonId}`, JSON.stringify(frame));
};

const getCachedFrame = (lessonId: string): FrameSummary | null => {
  const raw = storageAdapter.getItem(`niotebook.frame.${lessonId}`);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as FrameSummary;
  } catch {
    return null;
  }
};

const cacheCodeSnapshot = (
  lessonId: string,
  language: string,
  snapshot: CodeSnapshotSummary,
): void => {
  storageAdapter.setItem(
    `niotebook.code.${lessonId}.${language}`,
    JSON.stringify(snapshot),
  );
};

const getCachedCodeSnapshot = (
  lessonId: string,
  language: string,
): CodeSnapshotSummary | null => {
  const raw = storageAdapter.getItem(`niotebook.code.${lessonId}.${language}`);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CodeSnapshotSummary;
  } catch {
    return null;
  }
};

export { cacheCodeSnapshot, cacheFrame, getCachedCodeSnapshot, getCachedFrame };
