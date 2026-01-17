import type {
  ChatThreadId,
  CodeSnapshotId,
  FrameId,
  LessonId,
  UserId,
} from "./ids";

type FrameSummary = {
  id: FrameId;
  userId: UserId;
  lessonId: LessonId;
  videoTimeSec: number;
  threadId?: ChatThreadId;
  codeHash?: string;
  updatedAt: number;
};

type FrameUpsertInput = {
  userId: UserId;
  lessonId: LessonId;
  videoTimeSec: number;
  threadId?: ChatThreadId;
  codeHash?: string;
};

type FramePatch = {
  videoTimeSec: number;
  updatedAt: number;
  threadId?: ChatThreadId;
  codeHash?: string;
};

type FrameInsert = FramePatch & {
  userId: UserId;
  lessonId: LessonId;
};

type FrameRecord = FrameInsert & {
  _id: FrameId;
};

type CodeSnapshotSummary = {
  id: CodeSnapshotId;
  userId: UserId;
  lessonId: LessonId;
  language: string;
  code: string;
  codeHash: string;
  updatedAt: number;
};

type CodeSnapshotUpsertInput = {
  userId: UserId;
  lessonId: LessonId;
  language: string;
  code: string;
  codeHash: string;
};

type CodeSnapshotPatch = {
  code: string;
  codeHash: string;
  updatedAt: number;
};

type CodeSnapshotInsert = CodeSnapshotPatch & {
  userId: UserId;
  lessonId: LessonId;
  language: string;
};

type CodeSnapshotRecord = CodeSnapshotInsert & {
  _id: CodeSnapshotId;
};

const toFrameSummary = (record: FrameRecord): FrameSummary => {
  return {
    id: record._id,
    userId: record.userId,
    lessonId: record.lessonId,
    videoTimeSec: record.videoTimeSec,
    threadId: record.threadId,
    codeHash: record.codeHash,
    updatedAt: record.updatedAt,
  };
};

const resolveFrameSummary = (
  id: FrameId,
  existing: FrameSummary | null,
  input: FrameUpsertInput,
  updatedAt: number,
): FrameSummary => {
  return {
    id,
    userId: input.userId,
    lessonId: input.lessonId,
    videoTimeSec: input.videoTimeSec,
    threadId: input.threadId ?? existing?.threadId,
    codeHash: input.codeHash ?? existing?.codeHash,
    updatedAt,
  };
};

const buildFramePatch = (
  input: FrameUpsertInput,
  updatedAt: number,
): FramePatch => {
  const patch: FramePatch = {
    videoTimeSec: input.videoTimeSec,
    updatedAt,
  };

  if (input.threadId !== undefined) {
    patch.threadId = input.threadId;
  }

  if (input.codeHash !== undefined) {
    patch.codeHash = input.codeHash;
  }

  return patch;
};

const buildFrameInsert = (
  input: FrameUpsertInput,
  updatedAt: number,
): FrameInsert => {
  return {
    userId: input.userId,
    lessonId: input.lessonId,
    ...buildFramePatch(input, updatedAt),
  };
};

const toCodeSnapshotSummary = (
  record: CodeSnapshotRecord,
): CodeSnapshotSummary => {
  return {
    id: record._id,
    userId: record.userId,
    lessonId: record.lessonId,
    language: record.language,
    code: record.code,
    codeHash: record.codeHash,
    updatedAt: record.updatedAt,
  };
};

const resolveCodeSnapshotSummary = (
  id: CodeSnapshotId,
  input: CodeSnapshotUpsertInput,
  updatedAt: number,
): CodeSnapshotSummary => {
  return {
    id,
    userId: input.userId,
    lessonId: input.lessonId,
    language: input.language,
    code: input.code,
    codeHash: input.codeHash,
    updatedAt,
  };
};

const buildCodeSnapshotPatch = (
  input: CodeSnapshotUpsertInput,
  updatedAt: number,
): CodeSnapshotPatch => {
  return {
    code: input.code,
    codeHash: input.codeHash,
    updatedAt,
  };
};

const buildCodeSnapshotInsert = (
  input: CodeSnapshotUpsertInput,
  updatedAt: number,
): CodeSnapshotInsert => {
  return {
    userId: input.userId,
    lessonId: input.lessonId,
    language: input.language,
    ...buildCodeSnapshotPatch(input, updatedAt),
  };
};

export type {
  CodeSnapshotRecord,
  CodeSnapshotSummary,
  CodeSnapshotUpsertInput,
  FrameRecord,
  FrameSummary,
  FrameUpsertInput,
};
export {
  buildCodeSnapshotInsert,
  buildCodeSnapshotPatch,
  buildFrameInsert,
  buildFramePatch,
  resolveCodeSnapshotSummary,
  resolveFrameSummary,
  toCodeSnapshotSummary,
  toFrameSummary,
};
