import { describe, it, expect } from "vitest";
import {
  resolveLessonCompletionSummary,
  toLessonCompletionSummary,
} from "@/domain/lesson-completions";
import type {
  LessonCompletionRecord,
  LessonCompletionUpsertInput,
} from "@/domain/lesson-completions";
import type { LessonCompletionId, LessonId, UserId } from "@/domain/ids";

/* ------------------------------------------------------------------ */
/*  Fixtures                                                          */
/* ------------------------------------------------------------------ */

const userId = "user-1" as UserId;
const lessonId = "lesson-1" as LessonId;
const completionId = "completion-1" as LessonCompletionId;
const completedAt = 1_700_000_000_000;

function makeInput(
  overrides: Partial<LessonCompletionUpsertInput> = {},
): LessonCompletionUpsertInput {
  return {
    userId,
    lessonId,
    completionMethod: "video",
    ...overrides,
  };
}

function makeRecord(
  overrides: Partial<LessonCompletionRecord> = {},
): LessonCompletionRecord {
  return {
    _id: completionId,
    userId,
    lessonId,
    completionMethod: "video",
    completedAt,
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*  resolveLessonCompletionSummary                                    */
/* ------------------------------------------------------------------ */

describe("resolveLessonCompletionSummary", () => {
  it("builds a summary from id, input, and completedAt", () => {
    const input = makeInput({ completionPct: 85 });
    const summary = resolveLessonCompletionSummary(
      completionId,
      input,
      completedAt,
    );

    expect(summary).toEqual({
      id: completionId,
      userId,
      lessonId,
      completionMethod: "video",
      completionPct: 85,
      completedAt,
    });
  });

  it("handles undefined completionPct", () => {
    const input = makeInput(); // no completionPct
    const summary = resolveLessonCompletionSummary(
      completionId,
      input,
      completedAt,
    );

    expect(summary.completionPct).toBeUndefined();
  });

  it("supports the 'code' completion method", () => {
    const input = makeInput({ completionMethod: "code", completionPct: 100 });
    const summary = resolveLessonCompletionSummary(
      completionId,
      input,
      completedAt,
    );

    expect(summary.completionMethod).toBe("code");
    expect(summary.completionPct).toBe(100);
  });

  it("preserves the exact completedAt timestamp", () => {
    const ts = 1_800_000_000_000;
    const summary = resolveLessonCompletionSummary(
      completionId,
      makeInput(),
      ts,
    );

    expect(summary.completedAt).toBe(ts);
  });
});

/* ------------------------------------------------------------------ */
/*  toLessonCompletionSummary                                         */
/* ------------------------------------------------------------------ */

describe("toLessonCompletionSummary", () => {
  it("maps _id to id and copies all fields", () => {
    const record = makeRecord({ completionPct: 50 });
    const summary = toLessonCompletionSummary(record);

    expect(summary).toEqual({
      id: completionId,
      userId,
      lessonId,
      completionMethod: "video",
      completionPct: 50,
      completedAt,
    });
  });

  it("preserves undefined completionPct from record", () => {
    const record = makeRecord(); // no completionPct
    const summary = toLessonCompletionSummary(record);

    expect(summary.completionPct).toBeUndefined();
  });

  it("maps a code completion record correctly", () => {
    const record = makeRecord({
      _id: "comp-2" as LessonCompletionId,
      completionMethod: "code",
      completionPct: 100,
      completedAt: 1_750_000_000_000,
    });
    const summary = toLessonCompletionSummary(record);

    expect(summary.id).toBe("comp-2");
    expect(summary.completionMethod).toBe("code");
    expect(summary.completionPct).toBe(100);
    expect(summary.completedAt).toBe(1_750_000_000_000);
  });
});
