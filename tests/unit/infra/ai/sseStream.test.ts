import { describe, it, expect } from "vitest";
import { readSseStream } from "@/infra/ai/sseStream";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a ReadableStream<Uint8Array> from an array of string chunks. */
const makeStream = (chunks: string[]): ReadableStream<Uint8Array> => {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
};

/** Collect all yielded values from an async generator into an array. */
const collect = async (gen: AsyncGenerator<string>): Promise<string[]> => {
  const results: string[] = [];
  for await (const token of gen) {
    results.push(token);
  }
  return results;
};

/** Identity parseToken: returns string payloads that are plain objects with a `t` field. */
const parseTField = (parsed: unknown): string | null => {
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "t" in parsed &&
    typeof (parsed as { t: unknown }).t === "string"
  ) {
    return (parsed as { t: string }).t || null;
  }
  return null;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("readSseStream", () => {
  it("happy path: yields tokens from valid data: lines", async () => {
    const stream = makeStream(['data: {"t":"hello"}\ndata: {"t":" world"}\n']);
    const tokens = await collect(readSseStream(stream, parseTField));
    expect(tokens).toEqual(["hello", " world"]);
  });

  it("partial chunks: split SSE line across two reads still parses correctly", async () => {
    // The first chunk ends mid-line; the second chunk completes it.
    const stream = makeStream(['data: {"t":"par', 'tial"}\n']);
    const tokens = await collect(readSseStream(stream, parseTField));
    expect(tokens).toEqual(["partial"]);
  });

  it("[DONE] termination: lines with [DONE] are skipped and not yielded", async () => {
    const stream = makeStream([
      'data: {"t":"before"}\ndata: [DONE]\ndata: {"t":"after"}\n',
    ]);
    const tokens = await collect(readSseStream(stream, parseTField));
    // [DONE] is skipped; lines after it continue to be processed
    expect(tokens).toEqual(["before", "after"]);
  });

  it("malformed JSON: invalid JSON lines are silently skipped", async () => {
    const stream = makeStream(['data: {not-valid-json}\ndata: {"t":"ok"}\n']);
    const tokens = await collect(readSseStream(stream, parseTField));
    expect(tokens).toEqual(["ok"]);
  });

  it("empty lines and non-data: lines are ignored", async () => {
    const stream = makeStream(["\n\nevent: ping\n\ndata: \ndata: \ndata: \n"]);
    const tokens = await collect(readSseStream(stream, parseTField));
    expect(tokens).toEqual([]);
  });

  it("allowRawJson=true: parses lines without data: prefix as raw JSON", async () => {
    const stream = makeStream(['{"t":"raw"}\n']);
    const tokens = await collect(readSseStream(stream, parseTField, true));
    expect(tokens).toEqual(["raw"]);
  });

  it("allowRawJson=false (default): ignores lines without data: prefix", async () => {
    const stream = makeStream(['{"t":"raw"}\n']);
    const tokens = await collect(readSseStream(stream, parseTField));
    expect(tokens).toEqual([]);
  });

  it("parseToken returning null skips the line without yielding", async () => {
    const stream = makeStream(['data: {"t":""}\ndata: {"t":"real"}\n']);
    const tokens = await collect(readSseStream(stream, parseTField));
    // empty string `t` causes parseTField to return null — skipped
    expect(tokens).toEqual(["real"]);
  });
});
