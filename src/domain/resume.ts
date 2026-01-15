import type { GenericId } from "convex/values";

type FrameSummary = {
  id: GenericId<"frames">;
  userId: GenericId<"users">;
  lessonId: GenericId<"lessons">;
  videoTimeSec: number;
  threadId?: GenericId<"chatThreads">;
  codeHash?: string;
  updatedAt: number;
};

type FrameUpsertInput = {
  userId: GenericId<"users">;
  lessonId: GenericId<"lessons">;
  videoTimeSec: number;
  threadId?: GenericId<"chatThreads">;
  codeHash?: string;
};

type FramePatch = {
  videoTimeSec: number;
  updatedAt: number;
  threadId?: GenericId<"chatThreads">;
  codeHash?: string;
};

type FrameInsert = FramePatch & {
  userId: GenericId<"users">;
  lessonId: GenericId<"lessons">;
};

type FrameRecord = FrameInsert & {
  _id: GenericId<"frames">;
};

type CodeSnapshotSummary = {
  id: GenericId<"codeSnapshots">;
  userId: GenericId<"users">;
  lessonId: GenericId<"lessons">;
  language: string;
  code: string;
  codeHash: string;
  updatedAt: number;
};

type CodeSnapshotUpsertInput = {
  userId: GenericId<"users">;
  lessonId: GenericId<"lessons">;
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
  userId: GenericId<"users">;
  lessonId: GenericId<"lessons">;
  language: string;
};

type CodeSnapshotRecord = CodeSnapshotInsert & {
  _id: GenericId<"codeSnapshots">;
};

const toFrameSummary = (record: FrameRecord): FrameSummary => {
  return {
    id: record._id,
    userId: record.userId,
    lessonId: record.lessonId,
    videoTimeSec: record.videoTimeSec,
    threadId: record.threadId,
    codeHash: record.codeHash,
    updatedAt: record.updatedAt
  };
};

const resolveFrameSummary = (
  id: GenericId<"frames">,
  existing: FrameSummary | null,
  input: FrameUpsertInput,
  updatedAt: number
): FrameSummary => {
  return {
    id,
    userId: input.userId,
    lessonId: input.lessonId,
    videoTimeSec: input.videoTimeSec,
    threadId: input.threadId ?? existing?.threadId,
    codeHash: input.codeHash ?? existing?.codeHash,
    updatedAt
  };
};

const buildFramePatch = (
  input: FrameUpsertInput,
  updatedAt: number
): FramePatch => {
  const patch: FramePatch = {
    videoTimeSec: input.videoTimeSec,
    updatedAt
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
  updatedAt: number
): FrameInsert => {
  return {
    userId: input.userId,
    lessonId: input.lessonId,
    ...buildFramePatch(input, updatedAt)
  };
};

const toCodeSnapshotSummary = (
  record: CodeSnapshotRecord
): CodeSnapshotSummary => {
  return {
    id: record._id,
    userId: record.userId,
    lessonId: record.lessonId,
    language: record.language,
    code: record.code,
    codeHash: record.codeHash,
    updatedAt: record.updatedAt
  };
};

const resolveCodeSnapshotSummary = (
  id: GenericId<"codeSnapshots">,
  input: CodeSnapshotUpsertInput,
  updatedAt: number
): CodeSnapshotSummary => {
  return {
    id,
    userId: input.userId,
    lessonId: input.lessonId,
    language: input.language,
    code: input.code,
    codeHash: input.codeHash,
    updatedAt
  };
};

const buildCodeSnapshotPatch = (
  input: CodeSnapshotUpsertInput,
  updatedAt: number
): CodeSnapshotPatch => {
  return {
    code: input.code,
    codeHash: input.codeHash,
    updatedAt
  };
};

const buildCodeSnapshotInsert = (
  input: CodeSnapshotUpsertInput,
  updatedAt: number
): CodeSnapshotInsert => {
  return {
    userId: input.userId,
    lessonId: input.lessonId,
    language: input.language,
    ...buildCodeSnapshotPatch(input, updatedAt)
  };
};

export type {
  CodeSnapshotRecord,
  CodeSnapshotSummary,
  CodeSnapshotUpsertInput,
  FrameRecord,
  FrameSummary,
  FrameUpsertInput
};
export {
  buildCodeSnapshotInsert,
  buildCodeSnapshotPatch,
  buildFrameInsert,
  buildFramePatch,
  resolveCodeSnapshotSummary,
  resolveFrameSummary,
  toCodeSnapshotSummary,
  toFrameSummary
};
