import { describe, expect, it } from "vitest";
import {
  buildEventLogError,
  validateEventMetadata,
  validateEventUserId,
} from "../../src/domain/events";

describe("event validation", (): void => {
  // ── happy-path tests ──────────────────────────────────────────────────────

  it("accepts valid video_play metadata (string + number fields)", (): void => {
    const result = validateEventMetadata("video_play", {
      lessonId: "lesson-1",
      videoTimeSec: 42,
    });

    expect(result.ok).toBe(true);
  });

  it("accepts valid code_run metadata (string + boolean + number fields)", (): void => {
    const result = validateEventMetadata("code_run", {
      lessonId: "lesson-1",
      language: "python",
      success: true,
      runtimeMs: 123,
    });

    expect(result.ok).toBe(true);
  });

  it("accepts valid ai_fallback_triggered metadata (five string fields)", (): void => {
    const result = validateEventMetadata("ai_fallback_triggered", {
      lessonId: "lesson-1",
      threadId: "thread-1",
      fromProvider: "gemini",
      toProvider: "groq",
      reason: "rate_limit",
    });

    expect(result.ok).toBe(true);
  });

  it("accepts valid magic_link_sent metadata (single string field)", (): void => {
    const result = validateEventMetadata("magic_link_sent", {
      emailHash: "abc123",
    });

    expect(result.ok).toBe(true);
  });

  it("accepts valid course_selected metadata", (): void => {
    const result = validateEventMetadata("course_selected", {
      courseId: "course-1",
    });

    expect(result.ok).toBe(true);
  });

  // ── empty string rejection ────────────────────────────────────────────────

  it("rejects empty string for emailHash in magic_link_sent", (): void => {
    const result = validateEventMetadata("magic_link_sent", {
      emailHash: "",
    });

    expect(result.ok).toBe(false);
  });

  it("rejects empty string for courseId in course_selected", (): void => {
    const result = validateEventMetadata("course_selected", {
      courseId: "",
    });

    expect(result.ok).toBe(false);
  });

  it("rejects empty string for lessonId in video_play", (): void => {
    const result = validateEventMetadata("video_play", {
      lessonId: "",
      videoTimeSec: 10,
    });

    expect(result.ok).toBe(false);
  });

  // ── wrong-type rejection ──────────────────────────────────────────────────

  it("rejects number where string expected (courseId in course_selected)", (): void => {
    const result = validateEventMetadata("course_selected", {
      courseId: 123,
    });

    expect(result.ok).toBe(false);
  });

  it("rejects string where number expected (videoTimeSec in video_play)", (): void => {
    const result = validateEventMetadata("video_play", {
      lessonId: "lesson-1",
      videoTimeSec: "not-a-number",
    });

    expect(result.ok).toBe(false);
  });

  it("rejects string where boolean expected (success in code_run)", (): void => {
    const result = validateEventMetadata("code_run", {
      lessonId: "lesson-1",
      language: "js",
      success: "yes",
      runtimeMs: 10,
    });

    expect(result.ok).toBe(false);
  });

  // ── undefined / missing field rejection ───────────────────────────────────

  it("rejects undefined emailHash in magic_link_sent (single-field validator)", (): void => {
    const result = validateEventMetadata("magic_link_sent", {
      emailHash: undefined,
    });

    expect(result.ok).toBe(false);
  });

  it("rejects undefined courseId in course_selected (single-field validator)", (): void => {
    const result = validateEventMetadata("course_selected", {
      courseId: undefined,
    });

    expect(result.ok).toBe(false);
  });

  // ── error structure ───────────────────────────────────────────────────────

  it("includes event type in error detail on validation failure", (): void => {
    const result = validateEventMetadata("lesson_started", {
      courseId: "course-1",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_EVENT_METADATA");
      expect(result.error.message).toContain("lesson_started");
    }
  });

  // ── user id validation ────────────────────────────────────────────────────

  it("rejects missing user id", (): void => {
    const result = validateEventUserId(undefined);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toEqual(buildEventLogError("MISSING_USER_ID"));
    }
  });
});
