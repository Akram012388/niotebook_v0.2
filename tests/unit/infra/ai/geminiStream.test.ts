import { afterEach, describe, expect, it, vi } from "vitest";
import { streamGemini, GEMINI_MODEL } from "@/infra/ai/geminiStream";
import { NioProviderStreamError } from "@/infra/ai/providerTypes";
import type { NioContextMessage } from "@/domain/nioContextBuilder";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_INPUT = {
  messages: [
    { role: "user" as const, content: "What is a pointer?" },
  ] satisfies NioContextMessage[],
  maxOutputTokens: 256,
  apiKey: "test-key-abc",
};

/** Build a single Gemini SSE data line for a token chunk. */
const geminiSseLine = (text: string): string =>
  `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })}\n\n`;

/** Encode a string into a ReadableStream of Uint8Array chunks. */
const makeStreamBody = (sseData: string): ReadableStream<Uint8Array> => {
  const encoded = new TextEncoder().encode(sseData);
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoded);
      controller.close();
    },
  });
};

/** Stub global fetch to return a 200 OK with an SSE streaming body. */
const stubFetchOk = (tokens: string[]): void => {
  const sseData = tokens.map(geminiSseLine).join("");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: makeStreamBody(sseData),
    }),
  );
};

/** Stub global fetch to return a non-ok response. */
const stubFetchError = (status: number): void => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      body: makeStreamBody(""),
    }),
  );
};

/** Collect all tokens from the result stream into an array. */
const collectTokens = async (
  stream: AsyncIterable<string>,
): Promise<string[]> => {
  const tokens: string[] = [];
  for await (const token of stream) {
    tokens.push(token);
  }
  return tokens;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("streamGemini", () => {
  it("returns provider=gemini and model=GEMINI_MODEL on success", async () => {
    stubFetchOk(["Hello"]);

    const result = await streamGemini(DEFAULT_INPUT);

    expect(result.provider).toBe("gemini");
    expect(result.model).toBe(GEMINI_MODEL);
    // Drain stream so it doesn't leak
    await collectTokens(result.stream);
  });

  it("yields a single token from a one-chunk response", async () => {
    stubFetchOk(["Hello world"]);

    const result = await streamGemini(DEFAULT_INPUT);
    const tokens = await collectTokens(result.stream);

    expect(tokens).toEqual(["Hello world"]);
  });

  it("yields multiple tokens across separate SSE chunks", async () => {
    stubFetchOk(["Hello", " there", " world"]);

    const result = await streamGemini(DEFAULT_INPUT);
    const tokens = await collectTokens(result.stream);

    expect(tokens).toEqual(["Hello", " there", " world"]);
    expect(tokens.join("")).toBe("Hello there world");
  });

  it("throws NioProviderStreamError on 401 Unauthorized", async () => {
    stubFetchError(401);

    await expect(streamGemini(DEFAULT_INPUT)).rejects.toBeInstanceOf(
      NioProviderStreamError,
    );
  });

  it("throws NioProviderStreamError with STREAM_ERROR code on 401", async () => {
    stubFetchError(401);

    try {
      await streamGemini(DEFAULT_INPUT);
      expect.fail("Expected streamGemini to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(NioProviderStreamError);
      if (err instanceof NioProviderStreamError) {
        expect(err.code).toBe("STREAM_ERROR");
        expect(err.status).toBe(401);
        expect(err.provider).toBe("gemini");
      }
    }
  });

  it("throws NioProviderStreamError with PROVIDER_429 code on 429", async () => {
    stubFetchError(429);

    try {
      await streamGemini(DEFAULT_INPUT);
      expect.fail("Expected streamGemini to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(NioProviderStreamError);
      if (err instanceof NioProviderStreamError) {
        expect(err.code).toBe("PROVIDER_429");
        expect(err.status).toBe(429);
      }
    }
  });

  it("throws NioProviderStreamError when fetch rejects (network error)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    );

    await expect(streamGemini(DEFAULT_INPUT)).rejects.toBeInstanceOf(
      NioProviderStreamError,
    );
  });

  it("includes original error message in the thrown error on network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("DNS resolution failed")),
    );

    try {
      await streamGemini(DEFAULT_INPUT);
      expect.fail("Expected streamGemini to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(NioProviderStreamError);
      if (err instanceof NioProviderStreamError) {
        expect(err.message).toContain("DNS resolution failed");
      }
    }
  });

  it("completes stream without yielding tokens for an empty SSE body", async () => {
    stubFetchOk([]);

    const result = await streamGemini(DEFAULT_INPUT);
    const tokens = await collectTokens(result.stream);

    expect(tokens).toEqual([]);
  });

  it("skips SSE lines with malformed JSON without throwing", async () => {
    const badData =
      "data: {not-valid-json}\n\ndata: " +
      JSON.stringify({
        candidates: [{ content: { parts: [{ text: "Good" }] } }],
      }) +
      "\n\n";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: makeStreamBody(badData),
      }),
    );

    const result = await streamGemini(DEFAULT_INPUT);
    const tokens = await collectTokens(result.stream);

    // Only the valid chunk should produce a token
    expect(tokens).toEqual(["Good"]);
  });

  it("skips [DONE] sentinel line without throwing", async () => {
    const sseData = geminiSseLine("Final token") + "data: [DONE]\n\n";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: makeStreamBody(sseData),
      }),
    );

    const result = await streamGemini(DEFAULT_INPUT);
    const tokens = await collectTokens(result.stream);

    expect(tokens).toEqual(["Final token"]);
  });
});
