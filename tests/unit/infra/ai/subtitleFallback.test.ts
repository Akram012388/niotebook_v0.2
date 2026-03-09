import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSubtitleWindow } from "@/infra/ai/subtitleFallback";

// The module has an in-memory cache keyed by URL.
// Use unique paths per test to avoid cross-test cache hits.
const BASE = "https://cdn.cs50.net/subs";

type SrtEntry = { id: number; start: string; end: string; text: string };

const buildSrt = (entries: SrtEntry[]): string =>
  entries
    .map((e) => `${e.id}\n${e.start} --> ${e.end}\n${e.text}\n`)
    .join("\n");

const stubFetchOk = (text: string): void => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(text),
    }),
  );
};

const stubFetchStatus = (status: number): void => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      text: () => Promise.resolve("error"),
    }),
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchSubtitleWindow", () => {
  it("returns text lines within the time window", async () => {
    stubFetchOk(
      buildSrt([
        {
          id: 1,
          start: "00:00:01,000",
          end: "00:00:03,000",
          text: "Hello world",
        },
        {
          id: 2,
          start: "00:00:10,000",
          end: "00:00:12,000",
          text: "Way later",
        },
      ]),
    );

    const result = await fetchSubtitleWindow({
      subtitlesUrl: `${BASE}/t1.srt`,
      startSec: 0,
      endSec: 5,
    });

    expect(result).toEqual(["Hello world"]);
  });

  it("excludes segments entirely outside the window", async () => {
    stubFetchOk(
      buildSrt([
        { id: 1, start: "00:00:01,000", end: "00:00:03,000", text: "Inside" },
        {
          id: 2,
          start: "00:00:20,000",
          end: "00:00:22,000",
          text: "After window",
        },
        {
          id: 3,
          start: "00:00:00,000",
          end: "00:00:00,400",
          text: "Before window",
        },
      ]),
    );

    const result = await fetchSubtitleWindow({
      subtitlesUrl: `${BASE}/t2.srt`,
      startSec: 2,
      endSec: 6,
    });

    expect(result).toEqual(["Inside"]);
  });

  it("propagates fetch rejection as a thrown error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network failure")),
    );

    await expect(
      fetchSubtitleWindow({
        subtitlesUrl: `${BASE}/t3.srt`,
        startSec: 0,
        endSec: 10,
      }),
    ).rejects.toThrow("Network failure");
  });

  it("returns empty array on non-ok HTTP response (404)", async () => {
    stubFetchStatus(404);

    const result = await fetchSubtitleWindow({
      subtitlesUrl: `${BASE}/t4.srt`,
      startSec: 0,
      endSec: 10,
    });

    expect(result).toEqual([]);
  });

  it("returns empty array for an empty SRT file", async () => {
    stubFetchOk("");

    const result = await fetchSubtitleWindow({
      subtitlesUrl: `${BASE}/t5.srt`,
      startSec: 0,
      endSec: 10,
    });

    expect(result).toEqual([]);
  });

  it("includes segments that partially overlap the window boundary", async () => {
    // Filter condition: segment.endSec >= startSec && segment.startSec <= endSec
    // Segment [8, 12] overlaps window [10, 20] → endSec(12) >= startSec(10) ✓
    // Segment [18, 22] overlaps window [10, 20] → startSec(18) <= endSec(20) ✓
    stubFetchOk(
      buildSrt([
        {
          id: 1,
          start: "00:00:08,000",
          end: "00:00:12,000",
          text: "Starts before ends inside",
        },
        {
          id: 2,
          start: "00:00:18,000",
          end: "00:00:22,000",
          text: "Starts inside ends after",
        },
      ]),
    );

    const result = await fetchSubtitleWindow({
      subtitlesUrl: `${BASE}/t6.srt`,
      startSec: 10,
      endSec: 20,
    });

    expect(result).toEqual([
      "Starts before ends inside",
      "Starts inside ends after",
    ]);
  });

  it("does not re-fetch when the same URL is requested twice within the TTL", async () => {
    const srt = buildSrt([
      { id: 1, start: "00:00:01,000", end: "00:00:03,000", text: "Cached" },
    ]);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(srt),
    });
    vi.stubGlobal("fetch", fetchMock);

    const url = `${BASE}/cache-hit-test.srt`;
    await fetchSubtitleWindow({ subtitlesUrl: url, startSec: 0, endSec: 5 });
    await fetchSubtitleWindow({ subtitlesUrl: url, startSec: 0, endSec: 5 });

    // fetch should only have been called once — second call is served from cache
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws when the URL hostname is not in the allowlist", async () => {
    await expect(
      fetchSubtitleWindow({
        subtitlesUrl: "https://evil.example.com/sub.srt",
        startSec: 0,
        endSec: 10,
      }),
    ).rejects.toThrow("hostname not in allowlist");
  });

  it("throws when the URL is syntactically invalid", async () => {
    await expect(
      fetchSubtitleWindow({
        subtitlesUrl: "not-a-url",
        startSec: 0,
        endSec: 10,
      }),
    ).rejects.toThrow("Invalid subtitle URL");
  });

  it("throws when the URL does not use HTTPS", async () => {
    await expect(
      fetchSubtitleWindow({
        subtitlesUrl: "http://cdn.cs50.net/sub.srt",
        startSec: 0,
        endSec: 10,
      }),
    ).rejects.toThrow("HTTPS");
  });
});
