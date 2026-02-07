# P0 Backlog Review

**Date:** February 3, 2026
**Reviewer:** Claude Opus 4.5
**Status:** Code-Verified Analysis

---

## Summary

All 5 P0 items are **VALIDATED** as genuine alpha-blocking issues. Each has been verified against the actual codebase. Below are my findings with refinements and implementation notes.

---

## P0-1: Execution Isolation + Real Cancellation for JS/Python

### Verdict: ✅ CONFIRMED — Critical Issue

**Evidence from code:**

`jsExecutor.ts` (lines 152-155):

```typescript
const stop = (): void => {
  aborted = true; // Just sets a flag - doesn't terminate anything
};
```

`pythonExecutor.ts` (lines 212-214):

```typescript
const stop = (): void => {
  return; // NO-OP!
};
```

**Analysis:**

- JS runs in a sandboxed iframe via `runInSandboxedIframe()`, but `stop()` merely sets an `aborted` flag that nothing checks during execution
- Python uses `Promise.race` with a timeout, but the actual Pyodide execution continues running even after timeout
- An infinite `while(true){}` in JS or Python will freeze the UI or consume resources until timeout resolves

**Recommendation Refinements:**

1. **JS:** Destroy and recreate the iframe on `stop()` — this is the only reliable termination method for iframes
2. **Python:** Use `pyodide.setInterruptBuffer()` which enables cooperative cancellation via SharedArrayBuffer (requires COOP/COEP headers — already present for Wasmer)
3. Consider adding execution status to terminal UI ("Running...", "Cancelling...")

**Priority:** P0 — Users will encounter this in normal usage with loops

---

## P0-2: Learning Pulse Context: File Name + Last Error

### Verdict: ✅ CONFIRMED — Partial Implementation Gap

**Evidence from code:**

`nioContextBuilder.ts` (lines 124-127):

```typescript
// Already supports fileName in code payload
const fileNamePart = code.fileName ? ` • ${code.fileName}` : "";
const codeLabel = code.codeHash
  ? `Code (${code.language}${fileNamePart} • ${code.codeHash})`
```

`AiPane.tsx` (lines 73-80):

```typescript
const codePayload = useMemo(
  () => ({
    language: codeSnapshot?.language ?? "unknown",
    codeHash: codeSnapshot?.codeHash,
    code: codeSnapshot?.code,
    // ⚠️ Missing: fileName is NOT populated!
  }),
  [codeSnapshot],
);
```

**Analysis:**

- The infrastructure exists in `nioContextBuilder.ts` to handle `fileName` and `lastError`
- But `AiPane.tsx` does NOT pass `fileName` in the `codePayload`
- `lastError` is accepted by the context builder but not tracked/passed from terminal
- Context strip shows `Code: JS (modified)` but not the actual filename

**Recommendation Refinements:**

1. Add `fileName` to `CodeSnapshotSummary` type
2. Source it from active VFS tab path in `useEditorStore`
3. Track `lastRunError` in `useTerminalStore` on non-zero exit
4. Update `NioChatRequest` to include `lastError` field
5. Context strip should show: `Lecture 3 │ 12:34 │ main.py (modified)`

**Files to change:**

- `src/domain/resume.ts` — add `fileName` to `CodeSnapshotSummary`
- `convex/schema.ts` — add `fileName` to `codeSnapshots` table
- `src/ui/panes/AiPane.tsx` — populate `fileName` and `lastError`
- `src/ui/code/terminal/useTerminalStore.ts` — track `lastError`

**Priority:** P0 — Core PRD feature (Learning Pulse)

---

## P0-3: Course Card Counts + Accurate Progress

### Verdict: ✅ CONFIRMED — Missing Query

**Evidence from code:**

`convex/content.ts` `getCourses` (lines 68-74):

```typescript
const getCourses = query({
  args: {},
  handler: async (ctx): Promise<CourseSummary[]> => {
    const courses = await ctx.db.query("courses").collect();
    return orderCoursesByTitle(courses.map(toCourseSummary));
    // ⚠️ NO lessonCount included!
  },
});
```

`CourseSummary` type does NOT include `lessonCount`.

`CourseCard.tsx` expects `lessonCount` prop (line 13):

```typescript
lessonCount: number;
```

**Analysis:**

- `getCourses` returns course summaries WITHOUT lesson counts
- Frontend must either:
  - Call separate `getLessonsByCourse` for EACH course (N+1)
  - Or pass hardcoded 0 (shows "0 lectures")
- There IS `getCompletionCountsByCourses` for completions, but no equivalent for lesson counts

**Recommendation Refinements:**

1. Add `getCoursesWithCounts` query that returns:
   ```typescript
   { ...course, lessonCount: number }
   ```
2. Use single aggregation query, not N+1 pattern
3. Could extend `CourseSummary` type or create `CourseCardData` type

**Implementation approach:**

```typescript
// convex/content.ts
const getCoursesWithCounts = query({
  args: {},
  handler: async (ctx) => {
    const courses = await ctx.db.query("courses").collect();
    const lessons = await ctx.db.query("lessons").collect();

    const countsByCourse = new Map<string, number>();
    for (const lesson of lessons) {
      const key = lesson.courseId as string;
      countsByCourse.set(key, (countsByCourse.get(key) ?? 0) + 1);
    }

    return courses.map((c) => ({
      ...toCourseSummary(c),
      lessonCount: countsByCourse.get(c._id as string) ?? 0,
    }));
  },
});
```

**Priority:** P0 — Users see "0 lectures" on course cards

---

## P0-4: Auto Lesson Completion (Video ≥90%)

### Verdict: ✅ CONFIRMED — Not Implemented

**⚠️ Threshold Discrepancy:**

- **plan.md (line 219):** "Define lesson completion trigger (video ≥80% OR ≥1 successful code run)"
- **Your spec:** "Video ≥90%"

**Recommendation:** Use PRD definition of **80%** unless there's a deliberate change.

**Evidence from code:**

`VideoPlayer.tsx` (lines 201-212):

```typescript
if (event.data === state.ENDED) {
  setPlayState("paused");
  // ⚠️ No completion callback!
  onTimeUpdateRef.current?.(nextTime);
}
```

- `VideoPlayer` does NOT track progress against duration
- No call to `setLessonCompleted` mutation
- Manual "Mark Complete" button exists in `CourseDetailPage` but no auto-trigger

**Analysis:**

- The mutation `setLessonCompleted` exists and accepts `completionMethod: "video" | "code"`
- But nothing calls it automatically
- Need to compute `currentTimeSec / durationSec` and trigger at ≥0.8

**Recommendation Refinements:**

1. Add `durationSec` as a prop to `VideoPlayer` or workspace context
2. Compute progress in `onTimeUpdate` callback
3. Call `setLessonCompleted` when `progress >= 0.8` (per PRD, not 0.9)
4. Guard with local state or query existing completion to avoid repeated writes
5. Consider debouncing to avoid multiple triggers near threshold

**Implementation location:** `WorkspaceGrid.tsx` or new `useAutoCompletion` hook

**Priority:** P0 — Core PRD feature

---

## P0-5: Chat Timestamp Badges on Assistant Messages

### Verdict: ✅ CONFIRMED — Missing Feature

**Evidence from code:**

`ChatMessage.tsx` (lines 161-170):

```typescript
{isUser ? (
  <button
    type="button"
    onClick={handleSeek}
    className="text-[11px] ..."
  >
    {message.badge}
  </button>
) : null}  // ⚠️ Assistant messages get NO badge
```

**Analysis:**

- User messages show a clickable timestamp badge
- Assistant messages show NO badge
- PRD states "Badge per message" — this includes assistant responses

**Recommendation Refinements:**

1. Render badge for BOTH roles
2. Keep same seek behavior (clicking seeks video)
3. Position badge consistently (left for assistant, right for user maintains visual alignment)

**Simple fix:**

```typescript
// Always show badge, not just for user
<button
  type="button"
  onClick={handleSeek}
  className={`text-[11px] font-medium ... ${isUser ? '' : 'self-start'}`}
>
  {message.badge}
</button>
```

**Priority:** P0 — PRD compliance, quick fix (~5 lines)

---

## Additional Issues Found During Review

### N+1 Query Pattern in Completions

`convex/lessonCompletions.ts` `getCompletionsByCourse` (lines 142-167):

```typescript
for (const lesson of lessons) {
  const completion = await ctx.db.query("lessonCompletions")...
  // Individual query per lesson!
}
```

**Recommendation:** Batch query with indexed lookup:

```typescript
const allCompletions = await ctx.db
  .query("lessonCompletions")
  .withIndex("by_userId", (q) => q.eq("userId", userId))
  .collect();
const lessonIds = new Set(lessons.map((l) => l._id));
return allCompletions.filter((c) => lessonIds.has(c.lessonId));
```

---

## Revised Priority Order

Based on effort vs. impact:

| Order | Item                      | Effort | Impact   | Notes                        |
| ----- | ------------------------- | ------ | -------- | ---------------------------- |
| 1     | P0-5: Assistant badges    | 15 min | High     | Quick win, PRD compliance    |
| 2     | P0-3: Course counts       | 1 hr   | High     | Users see broken UI          |
| 3     | P0-2: Learning Pulse      | 2 hr   | High     | Core feature, multiple files |
| 4     | P0-4: Auto completion     | 2 hr   | Medium   | Feature gap, not broken      |
| 5     | P0-1: Execution isolation | 4 hr   | Critical | Complex, but rare edge case  |

**Recommendation:** Start with P0-5 → P0-3 → P0-2 for quick momentum, then tackle P0-4 → P0-1.

---

## Test Coverage Gaps to Address

Per your spec, these tests are needed:

1. **Unit:** `nio-context-builder.test.ts` — assert `fileName` + `lastError` in context
2. **Unit:** New `getCoursesWithCounts` query test
3. **Unit:** Video completion threshold logic (pure helper function)
4. **E2E:** `workspace.e2e.ts` — verify kill stops long-running code
5. **E2E:** `courses.e2e.ts` — validate non-zero lecture counts
6. **E2E:** `chat.e2e.ts` — assert assistant badge exists and seek triggers

---

## Conclusion

All 5 P0 items are **valid alpha blockers**. The recommendations are accurate and the implementation approaches are sound. Key refinements:

1. Use **80%** threshold (per PRD), not 90%
2. Prioritize P0-5 first — fastest fix with immediate visibility
3. Address N+1 query patterns while fixing P0-3
4. Consider `pyodide.setInterruptBuffer()` for Python cancellation (requires SharedArrayBuffer)

The codebase architecture is solid — these are feature completions, not fundamental issues.

---

_This review was generated from direct code analysis. All line numbers reference actual source files._
