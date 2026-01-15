import type { GenericId } from "convex/values";
import { describe, expect, it } from "vitest";
import {
  buildCodeSnapshotPatch,
  resolveCodeSnapshotSummary,
  resolveFrameSummary,
  toCodeSnapshotSummary,
  toFrameSummary,
  type CodeSnapshotRecord,
  type CodeSnapshotSummary,
  type CodeSnapshotUpsertInput,
  type FrameRecord,
  type FrameSummary,
  type FrameUpsertInput
} from "../../src/domain/resume";

describe("resume selectors", (): void => {
  it("maps frame records to summaries", (): void => {
    const userId = "user-1" as GenericId<"users">;
    const lessonId = "lesson-1" as GenericId<"lessons">;
    const threadId = "thread-1" as GenericId<"chatThreads">;

    const record: FrameRecord = {
      _id: "frame-1" as GenericId<"frames">,
      userId,
      lessonId,
      videoTimeSec: 120,
      threadId,
      codeHash: "hash-1",
      updatedAt: 1234
    };

    expect(toFrameSummary(record)).toEqual({
      id: record._id,
      userId,
      lessonId,
      videoTimeSec: 120,
      threadId,
      codeHash: "hash-1",
      updatedAt: 1234
    });
  });

  it("resolves frame upserts by overwriting fields", (): void => {
    const userId = "user-2" as GenericId<"users">;
    const lessonId = "lesson-2" as GenericId<"lessons">;
    const threadId = "thread-2" as GenericId<"chatThreads">;

    const existing: FrameSummary = {
      id: "frame-2" as GenericId<"frames">,
      userId,
      lessonId,
      videoTimeSec: 15,
      threadId,
      codeHash: "hash-old",
      updatedAt: 1000
    };

    const input: FrameUpsertInput = {
      userId,
      lessonId,
      videoTimeSec: 30
    };

    const resolved = resolveFrameSummary(existing.id, existing, input, 2000);

    expect(resolved.videoTimeSec).toBe(30);
    expect(resolved.threadId).toBe(threadId);
    expect(resolved.codeHash).toBe("hash-old");
    expect(resolved.updatedAt).toBe(2000);
  });

  it("maps code snapshots and overwrites values", (): void => {
    const userId = "user-3" as GenericId<"users">;
    const lessonId = "lesson-3" as GenericId<"lessons">;

    const input: CodeSnapshotUpsertInput = {
      userId,
      lessonId,
      language: "ts",
      code: "console.log('new')",
      codeHash: "hash-new"
    };

    const summary = resolveCodeSnapshotSummary(
      "snapshot-1" as GenericId<"codeSnapshots">,
      input,
      3000
    );

    expect(summary).toMatchObject({
      userId,
      lessonId,
      language: "ts",
      code: "console.log('new')",
      codeHash: "hash-new",
      updatedAt: 3000
    });
  });

  it("maps code snapshot records to summaries", (): void => {
    const userId = "user-4" as GenericId<"users">;
    const lessonId = "lesson-4" as GenericId<"lessons">;

    const record: CodeSnapshotRecord = {
      _id: "snapshot-2" as GenericId<"codeSnapshots">,
      userId,
      lessonId,
      language: "py",
      code: "print('hi')",
      codeHash: "hash-2",
      updatedAt: 4000
    };

    const summary: CodeSnapshotSummary = toCodeSnapshotSummary(record);

    expect(summary).toEqual({
      id: record._id,
      userId,
      lessonId,
      language: "py",
      code: "print('hi')",
      codeHash: "hash-2",
      updatedAt: 4000
    });
  });

  it("builds code snapshot patches from inputs", (): void => {
    const input: CodeSnapshotUpsertInput = {
      userId: "user-5" as GenericId<"users">,
      lessonId: "lesson-5" as GenericId<"lessons">,
      language: "js",
      code: "console.log('ok')",
      codeHash: "hash-3"
    };

    expect(buildCodeSnapshotPatch(input, 5000)).toEqual({
      code: "console.log('ok')",
      codeHash: "hash-3",
      updatedAt: 5000
    });
  });
});
