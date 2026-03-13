import { describe, it, expect } from "vitest";
import { makeTestEnv, api } from "./setup";

/** Seed a lesson with transcript segments at known times. */
async function seedTranscriptFixture() {
  const t = makeTestEnv();

  const lessonId = await t.run(async (ctx) => {
    const courseId = await ctx.db.insert("courses", {
      sourcePlaylistId: "pl-transcript",
      title: "Transcript Course",
      license: "MIT",
      sourceUrl: "https://example.com",
    });
    const lId = await ctx.db.insert("lessons", {
      courseId,
      videoId: "vid-transcript",
      title: "Transcript Lesson",
      durationSec: 600,
      order: 1,
      transcriptStatus: "ok",
    });

    // Insert segments at 10s intervals: [0-10], [10-20], [20-30], ... [90-100]
    for (let i = 0; i < 10; i++) {
      await ctx.db.insert("transcriptSegments", {
        lessonId: lId,
        idx: i,
        startSec: i * 10,
        endSec: (i + 1) * 10,
        textRaw: `Raw text for segment ${i}`,
        textNormalized: `Normalized text for segment ${i}`,
      });
    }

    return lId;
  });

  return { t, lessonId };
}

describe("transcripts — getTranscriptWindow", () => {
  it("returns segments within the requested time range", async () => {
    const { t, lessonId } = await seedTranscriptFixture();

    // Request window [30, 60] — segments with startSec 30, 40, 50 should match
    // Plus padding: TRANSCRIPT_START_PAD_SEC = 30, so lowerBound = max(0, 30-30) = 0
    // Query fetches startSec in [0, 60], then toTranscriptWindowSegments filters
    // by endSec >= 30 && startSec <= 60
    const segments = await t.query(api.transcripts.getTranscriptWindow, {
      lessonId,
      startSec: 30,
      endSec: 60,
    });

    expect(segments.length).toBeGreaterThan(0);
    // All returned segments should overlap with [30, 60]
    for (const seg of segments) {
      expect(seg.endSec).toBeGreaterThanOrEqual(30);
      expect(seg.startSec).toBeLessThanOrEqual(60);
    }
  });

  it("returns empty array for a lesson with no segments", async () => {
    const t = makeTestEnv();

    const lessonId = await t.run(async (ctx) => {
      const courseId = await ctx.db.insert("courses", {
        sourcePlaylistId: "pl-empty",
        title: "Empty Course",
        license: "MIT",
        sourceUrl: "https://example.com",
      });
      return ctx.db.insert("lessons", {
        courseId,
        videoId: "vid-empty",
        title: "Empty Lesson",
        durationSec: 300,
        order: 1,
        transcriptStatus: "missing",
      });
    });

    const segments = await t.query(api.transcripts.getTranscriptWindow, {
      lessonId,
      startSec: 0,
      endSec: 100,
    });

    expect(segments).toEqual([]);
  });

  it("respects startSec/endSec bounds — excludes out-of-range segments", async () => {
    const { t, lessonId } = await seedTranscriptFixture();

    // Narrow window [45, 55] — with pad (30), lowerBound = 15
    // DB query fetches startSec in [15, 55]: segments 2(20-30),3(30-40),4(40-50),5(50-60)
    // Then domain filter: endSec >= 45 && startSec <= 55
    // Segment 2 (20-30): endSec=30 < 45 — excluded
    // Segment 3 (30-40): endSec=40 < 45 — excluded
    // Segment 4 (40-50): endSec=50 >= 45 && startSec=40 <= 55 — included
    // Segment 5 (50-60): endSec=60 >= 45 && startSec=50 <= 55 — included
    const segments = await t.query(api.transcripts.getTranscriptWindow, {
      lessonId,
      startSec: 45,
      endSec: 55,
    });

    expect(segments).toHaveLength(2);
    expect(segments[0].idx).toBe(4);
    expect(segments[1].idx).toBe(5);
  });

  it("applies TRANSCRIPT_START_PAD_SEC padding to fetch earlier segments", async () => {
    const { t, lessonId } = await seedTranscriptFixture();

    // Window [60, 70] — pad = 30, so lowerBound = 30
    // DB fetches startSec in [30, 70]: segments 3(30-40),4(40-50),5(50-60),6(60-70)
    // Domain filter: endSec >= 60 && startSec <= 70
    // Segment 3: endSec=40 < 60 — excluded
    // Segment 4: endSec=50 < 60 — excluded
    // Segment 5: endSec=60 >= 60 && startSec=50 <= 70 — included (thanks to padding!)
    // Segment 6: endSec=70 >= 60 && startSec=60 <= 70 — included
    const segments = await t.query(api.transcripts.getTranscriptWindow, {
      lessonId,
      startSec: 60,
      endSec: 70,
    });

    // Segment 5 (startSec=50) is only reachable because the DB query
    // used lowerBound = 60 - 30 = 30, fetching segments starting from 30.
    // Without padding, lowerBound would be 60 and segment 5 would be missed.
    const includesSegment5 = segments.some((s) => s.idx === 5);
    expect(includesSegment5).toBe(true);

    // Verify segments 6 and 7 are also present
    // Segment 6: startSec=60, endSec=70 — overlaps [60,70]
    // Segment 7: startSec=70, endSec=80 — startSec<=70 so DB includes it,
    //   and endSec=80 >= 60 && startSec=70 <= 70, so domain filter keeps it
    const includesSegment6 = segments.some((s) => s.idx === 6);
    expect(includesSegment6).toBe(true);

    expect(segments.length).toBe(3);
  });
});
