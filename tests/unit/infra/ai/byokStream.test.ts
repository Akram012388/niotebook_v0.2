import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { streamStub, streamWithByok } from "@/infra/ai/byokStream";
import { streamGemini } from "@/infra/ai/geminiStream";
import type { NioSseEvent } from "@/domain/ai/types";
import type { NioContextMessage } from "@/domain/nioContextBuilder";
import type { NioProviderStreamResult } from "@/infra/ai/providerTypes";
import { NioProviderStreamError } from "@/infra/ai/providerTypes";

vi.mock("@/infra/ai/geminiStream", () => ({
  streamGemini: vi.fn(),
  GEMINI_MODEL: "gemini-3-flash-preview",
}));
vi.mock("@/infra/ai/openaiStream", () => ({
  streamOpenAI: vi.fn(),
}));
vi.mock("@/infra/ai/anthropicStream", () => ({
  streamAnthropic: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function* makeTokenStream(tokens: string[]): AsyncGenerator<string> {
  for (const token of tokens) {
    yield token;
  }
}

type FakeClient = {
  action: ReturnType<typeof vi.fn>;
  mutation: ReturnType<typeof vi.fn>;
};

const makeClient = (
  resolvedValue: { provider: string; key: string } | null = null,
): FakeClient => ({
  action: vi.fn().mockResolvedValue(resolvedValue),
  mutation: vi.fn().mockResolvedValue(undefined),
});

const BASE_ARGS = {
  requestId: "req-1",
  assistantTempId: "temp-1",
  contextHash: "hash-abc",
  inputChars: 100,
  budget: {
    maxOutputTokens: 1000,
    maxContextTokens: 4000,
    approxCharBudget: 3000,
  },
  threadId: "thread-1",
  lessonId: "lesson-1",
  videoTimeSec: 0,
  timeWindow: { startSec: 0, endSec: 30 },
  messages: [] as NioContextMessage[],
  isAborted: () => false,
} as const;

const STUB_ARGS = {
  requestId: "req-stub",
  assistantTempId: "temp-stub",
  contextHash: "hash-stub",
  inputChars: 50,
  budget: {
    maxOutputTokens: 500,
    maxContextTokens: 2000,
    approxCharBudget: 1500,
  },
  threadId: "thread-stub",
  videoTimeSec: 0,
  timeWindow: { startSec: 0, endSec: 30 },
  isAborted: () => false,
} as const;

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Disable Convex persistence so fire-and-forget mutations are skipped
  process.env.NEXT_PUBLIC_DISABLE_CONVEX = "true";
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_DISABLE_CONVEX;
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// streamWithByok
// ---------------------------------------------------------------------------

describe("streamWithByok", () => {
  it("emits NO_API_KEY error when resolveForRequest returns null", async () => {
    const client = makeClient(null);
    const events: NioSseEvent[] = [];

    await streamWithByok({
      ...BASE_ARGS,
      client: client as never,
      enqueue: (e) => events.push(e),
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: "error", code: "NO_API_KEY" });
  });

  it("emits STREAM_ERROR error when resolveForRequest throws", async () => {
    const client = makeClient();
    client.action.mockRejectedValue(new Error("Convex unavailable"));
    const events: NioSseEvent[] = [];

    await streamWithByok({
      ...BASE_ARGS,
      client: client as never,
      enqueue: (e) => events.push(e),
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: "error", code: "STREAM_ERROR" });
  });

  it("emits meta → tokens → done in order for a successful gemini stream", async () => {
    const client = makeClient({ provider: "gemini", key: "gm-key" });
    const providerResult: NioProviderStreamResult = {
      provider: "gemini",
      model: "gemini-3-flash-preview",
      stream: makeTokenStream(["Hello", " world"]),
    };
    vi.mocked(streamGemini).mockResolvedValue(providerResult);

    const events: NioSseEvent[] = [];
    await streamWithByok({
      ...BASE_ARGS,
      client: client as never,
      enqueue: (e) => events.push(e),
    });

    const types = events.map((e) => e.type);
    expect(types[0]).toBe("meta");
    expect(types.slice(1, -1).every((t) => t === "token")).toBe(true);
    expect(types.at(-1)).toBe("done");

    const tokenEvents = events.filter((e) => e.type === "token");
    expect(tokenEvents).toHaveLength(2);
    expect(tokenEvents[0]).toMatchObject({
      type: "token",
      token: "Hello",
      seq: 1,
    });
    expect(tokenEvents[1]).toMatchObject({
      type: "token",
      token: " world",
      seq: 2,
    });

    const done = events.at(-1);
    expect(done).toMatchObject({ type: "done", finalText: "Hello world" });
  });

  it("emits error event when the provider stream function throws", async () => {
    const client = makeClient({ provider: "gemini", key: "gm-key" });
    vi.mocked(streamGemini).mockRejectedValue(
      new NioProviderStreamError("Rate limited", "PROVIDER_429", 429, "gemini"),
    );

    const events: NioSseEvent[] = [];
    await streamWithByok({
      ...BASE_ARGS,
      client: client as never,
      enqueue: (e) => events.push(e),
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "error",
      code: "PROVIDER_429",
      provider: "gemini",
    });
  });

  it("emits error event when the provider stream iteration throws mid-stream", async () => {
    const client = makeClient({ provider: "gemini", key: "gm-key" });

    async function* failingStream(): AsyncGenerator<string> {
      yield "Partial";
      throw new NioProviderStreamError(
        "Server error",
        "PROVIDER_5XX",
        502,
        "gemini",
      );
    }

    const providerResult: NioProviderStreamResult = {
      provider: "gemini",
      model: "gemini-3-flash-preview",
      stream: failingStream(),
    };
    vi.mocked(streamGemini).mockResolvedValue(providerResult);

    const events: NioSseEvent[] = [];
    await streamWithByok({
      ...BASE_ARGS,
      client: client as never,
      enqueue: (e) => events.push(e),
    });

    // meta + token("Partial") + error
    expect(events[0]).toMatchObject({ type: "meta" });
    expect(events[1]).toMatchObject({ type: "token", token: "Partial" });
    expect(events.at(-1)).toMatchObject({
      type: "error",
      code: "PROVIDER_5XX",
    });
  });

  it("stops emitting tokens and emits no done event when isAborted returns true mid-stream", async () => {
    const client = makeClient({ provider: "gemini", key: "gm-key" });

    async function* slowStream(): AsyncGenerator<string> {
      yield "first";
      yield "second";
      yield "third";
    }

    const providerResult: NioProviderStreamResult = {
      provider: "gemini",
      model: "gemini-3-flash-preview",
      stream: slowStream(),
    };
    vi.mocked(streamGemini).mockResolvedValue(providerResult);

    const events: NioSseEvent[] = [];
    let aborted = false;

    await streamWithByok({
      ...BASE_ARGS,
      client: client as never,
      isAborted: () => aborted,
      enqueue: (e) => {
        events.push(e);
        // Abort after receiving the first token
        if (e.type === "token") {
          aborted = true;
        }
      },
    });

    // meta + first token — then abort causes early return
    expect(events[0]).toMatchObject({ type: "meta" });
    const tokenEvents = events.filter((e) => e.type === "token");
    expect(tokenEvents).toHaveLength(1);
    expect(tokenEvents[0]).toMatchObject({ type: "token", token: "first" });
    // No done event because function returned early on abort
    expect(events.some((e) => e.type === "done")).toBe(false);
  });

  it("emits STREAM_ERROR when resolveForRequest returns an unrecognised provider", async () => {
    const client = makeClient({ provider: "groq", key: "gk-key" });
    const events: NioSseEvent[] = [];

    await streamWithByok({
      ...BASE_ARGS,
      client: client as never,
      enqueue: (e) => events.push(e),
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: "error", code: "STREAM_ERROR" });
  });
});

// ---------------------------------------------------------------------------
// streamStub
// ---------------------------------------------------------------------------

describe("streamStub", () => {
  it("emits meta, token events, and done event for the stub text", async () => {
    vi.useFakeTimers();
    const client = makeClient();
    const events: NioSseEvent[] = [];

    const promise = streamStub({
      ...STUB_ARGS,
      client: client as never,
      enqueue: (e) => events.push(e),
    });

    await vi.runAllTimersAsync();
    await promise;
    vi.useRealTimers();

    expect(events[0]).toMatchObject({ type: "meta", seq: 0 });
    expect(events.some((e) => e.type === "token")).toBe(true);
    expect(events.at(-1)).toMatchObject({ type: "done" });

    const done = events.at(-1);
    if (done?.type === "done") {
      expect(done.finalText.length).toBeGreaterThan(0);
      expect(done.provider).toBe("stub");
    }
  });

  it("stops emitting tokens when isAborted returns true after first token", async () => {
    vi.useFakeTimers();
    const client = makeClient();
    const events: NioSseEvent[] = [];
    let aborted = false;

    const promise = streamStub({
      ...STUB_ARGS,
      client: client as never,
      enqueue: (e) => {
        events.push(e);
        // Abort after seeing the first token
        if (e.type === "token") {
          aborted = true;
        }
      },
      isAborted: () => aborted,
    });

    await vi.runAllTimersAsync();
    await promise;
    vi.useRealTimers();

    const tokenEvents = events.filter((e) => e.type === "token");
    // Only 1 token should have been emitted before abort stopped the loop
    expect(tokenEvents).toHaveLength(1);
    // No done event because function returned early
    expect(events.some((e) => e.type === "done")).toBe(false);
  });
});
