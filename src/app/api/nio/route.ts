import { ConvexHttpClient } from "convex/browser";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { AI_FALLBACK_TIMEOUT_MS } from "../../../domain/ai-fallback";
import type { RateLimitDecision } from "../../../domain/rate-limits";
import type { NioErrorCode, NioSseEvent } from "../../../domain/ai/types";
import {
  buildNioContext,
  type NioContextMessage,
} from "../../../domain/nioContextBuilder";
import { NIO_SYSTEM_PROMPT } from "../../../domain/nioPrompt";
import { streamGemini } from "../../../infra/ai/geminiStream";
import { streamGroq } from "../../../infra/ai/groqStream";
import { encodeSseEvent, NIO_SSE_HEADERS } from "../../../infra/ai/nioSse";
import { shouldFallbackBeforeFirstToken } from "../../../infra/ai/fallbackGate";
import type {
  NioProviderId,
  NioProviderStreamResult,
} from "../../../infra/ai/providerTypes";
import {
  createProviderStreamError,
  isProviderStreamError,
  NioProviderStreamError,
} from "../../../infra/ai/providerTypes";
import { validateNioChatRequest } from "../../../infra/ai/validateNioChatRequest";
import { hashString } from "../../../infra/hash";

type ErrorBody = {
  error: {
    code: string;
    message: string;
  };
  retryAfterMs?: number;
};

const STUB_PROVIDER = "stub";
const STUB_MODEL = "nio-stub";

const isStubPreview = (): boolean => {
  return (
    process.env.NIOTEBOOK_E2E_PREVIEW === "true" ||
    process.env.NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW === "true"
  );
};

const isConvexEnabled = (): boolean => {
  return process.env.NEXT_PUBLIC_DISABLE_CONVEX !== "true";
};

const resolveConvexUrl = (): string => {
  return (
    process.env.NEXT_PUBLIC_CONVEX_URL ??
    process.env.CONVEX_URL ??
    "http://localhost:3210"
  );
};

const createConvexClient = (): ConvexHttpClient => {
  return new ConvexHttpClient(resolveConvexUrl(), {
    skipConvexDeploymentUrlCheck: true,
  });
};

const buildJsonResponse = (
  body: ErrorBody,
  status: number,
  headers?: Record<string, string>,
): Response => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(headers ?? {}),
    },
  });
};

const sleep = async (durationMs: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
};

const buildStubTokens = (text: string): string[] => {
  const parts = text.split(" ");
  return parts.map((part, index) => (index === 0 ? part : ` ${part}`));
};

const consumeAiRateLimit = async (): Promise<RateLimitDecision | null> => {
  if (!isConvexEnabled()) {
    return null;
  }

  const client = createConvexClient();
  return client.mutation(api.rateLimits.consumeAiRateLimit, {});
};

const persistAssistantMessage = async (args: {
  threadId: string;
  requestId: string;
  content: string;
  videoTimeSec: number;
  timeWindow: { startSec: number; endSec: number };
  codeHash?: string;
  provider: string;
  model: string;
  latencyMs: number;
  usedFallback: boolean;
  contextHash: string;
}): Promise<void> => {
  if (!isConvexEnabled()) {
    return;
  }

  const client = createConvexClient();
  await client.mutation(api.chat.completeAssistantMessage, {
    threadId: args.threadId as Id<"chatThreads">,
    requestId: args.requestId,
    content: args.content,
    videoTimeSec: args.videoTimeSec,
    timeWindow: args.timeWindow,
    codeHash: args.codeHash,
    provider: args.provider,
    model: args.model,
    latencyMs: args.latencyMs,
    usedFallback: args.usedFallback,
    contextHash: args.contextHash,
  });
};

const logAiFallbackEvent = async (args: {
  lessonId: string;
  threadId: string;
  fromProvider: NioProviderId;
  toProvider: NioProviderId;
  reason: string;
}): Promise<void> => {
  if (!isConvexEnabled()) {
    return;
  }

  const client = createConvexClient();
  await client.mutation(api.events.logEvent, {
    eventType: "ai_fallback_triggered",
    lessonId: args.lessonId as Id<"lessons">,
    metadata: {
      lessonId: args.lessonId as Id<"lessons">,
      threadId: args.threadId as Id<"chatThreads">,
      fromProvider: args.fromProvider,
      toProvider: args.toProvider,
      reason: args.reason,
    },
  });
};

type FirstTokenResult =
  | { kind: "token"; token: string }
  | { kind: "timeout" }
  | { kind: "error"; error: NioProviderStreamError };

const normalizeProviderError = (
  error: unknown,
  provider: NioProviderId,
): NioProviderStreamError => {
  if (isProviderStreamError(error)) {
    return error;
  }

  return createProviderStreamError(
    "Provider stream error.",
    undefined,
    provider,
  );
};

const readFirstToken = async (
  iterator: AsyncIterator<string>,
  timeoutMs: number,
  provider: NioProviderId,
): Promise<FirstTokenResult> => {
  if (timeoutMs <= 0) {
    return { kind: "timeout" };
  }

  try {
    const result = await Promise.race([
      iterator.next().then((value) => ({ kind: "result" as const, value })),
      sleep(timeoutMs).then(() => ({ kind: "timeout" as const })),
    ]);

    if (result.kind === "timeout") {
      return { kind: "timeout" };
    }

    if (result.value.done || typeof result.value.value !== "string") {
      return {
        kind: "error",
        error: createProviderStreamError(
          "Provider stream ended before first token.",
          undefined,
          provider,
        ),
      };
    }

    return { kind: "token", token: result.value.value };
  } catch (error) {
    return { kind: "error", error: normalizeProviderError(error, provider) };
  }
};

const shouldFallbackForFirstToken = (
  result: FirstTokenResult,
  elapsedMs: number,
): boolean => {
  return shouldFallbackBeforeFirstToken({
    hasFirstToken: result.kind === "token",
    elapsedMs,
    error: result.kind === "error" ? result.error : undefined,
  });
};

const resolveFallbackReason = (result: FirstTokenResult): string => {
  if (result.kind === "timeout") {
    return "timeout_first_token";
  }

  if (result.kind === "error") {
    if (result.error.code === "PROVIDER_429") {
      return "provider_429";
    }

    if (result.error.code === "PROVIDER_5XX") {
      return "provider_5xx";
    }

    return "provider_error";
  }

  return "unknown";
};

const streamStub = async (args: {
  requestId: string;
  assistantTempId: string;
  contextHash: string;
  inputChars: number;
  budget: {
    maxOutputTokens: number;
    maxContextTokens: number;
    approxCharBudget: number;
  };
  threadId: string;
  videoTimeSec: number;
  timeWindow: { startSec: number; endSec: number };
  codeHash?: string;
  enqueue: (event: NioSseEvent) => void;
  isAborted: () => boolean;
}): Promise<void> => {
  const startedAtMs = Date.now();
  const stubText = "Here is a stubbed response while preview mode is enabled.";
  const tokens = buildStubTokens(stubText);

  args.enqueue({
    type: "meta",
    requestId: args.requestId,
    assistantTempId: args.assistantTempId,
    provider: STUB_PROVIDER,
    model: STUB_MODEL,
    startedAtMs,
    contextHash: args.contextHash,
    budget: args.budget,
    seq: 0,
  });

  let seq = 1;
  let timeToFirstTokenMs = 0;
  let fullText = "";

  for (const token of tokens) {
    if (args.isAborted()) {
      return;
    }

    if (seq === 1) {
      timeToFirstTokenMs = Date.now() - startedAtMs;
    }

    fullText += token;
    args.enqueue({
      type: "token",
      requestId: args.requestId,
      assistantTempId: args.assistantTempId,
      seq,
      token,
    });
    seq += 1;
    await sleep(35);
  }

  const latencyMs = Date.now() - startedAtMs;

  args.enqueue({
    type: "done",
    requestId: args.requestId,
    assistantTempId: args.assistantTempId,
    seq,
    provider: STUB_PROVIDER,
    model: STUB_MODEL,
    usedFallback: false,
    latencyMs,
    timeToFirstTokenMs,
    usageApprox: {
      inputChars: args.inputChars,
      outputChars: fullText.length,
    },
    finalText: fullText,
  });

  try {
    await persistAssistantMessage({
      threadId: args.threadId,
      requestId: args.requestId,
      content: fullText,
      videoTimeSec: args.videoTimeSec,
      timeWindow: args.timeWindow,
      codeHash: args.codeHash,
      provider: STUB_PROVIDER,
      model: STUB_MODEL,
      latencyMs,
      usedFallback: false,
      contextHash: args.contextHash,
    });
  } catch {
    return;
  }
};

const streamWithProviders = async (args: {
  requestId: string;
  assistantTempId: string;
  contextHash: string;
  inputChars: number;
  budget: {
    maxOutputTokens: number;
    maxContextTokens: number;
    approxCharBudget: number;
  };
  threadId: string;
  lessonId: string;
  videoTimeSec: number;
  timeWindow: { startSec: number; endSec: number };
  codeHash?: string;
  messages: NioContextMessage[];
  enqueue: (event: NioSseEvent) => void;
  isAborted: () => boolean;
}): Promise<void> => {
  const startedAtMs = Date.now();
  let usedFallback = false;
  let providerResult: NioProviderStreamResult | null = null;
  let iterator: AsyncIterator<string> | null = null;
  let firstToken: string | null = null;

  const emitErrorEvent = (
    code: NioErrorCode,
    message: string,
    provider?: NioProviderId,
  ): void => {
    args.enqueue({
      type: "error",
      requestId: args.requestId,
      assistantTempId: args.assistantTempId,
      seq: 1,
      code,
      message,
      provider,
    });
  };

  const attemptProvider = async (
    factory: () => Promise<NioProviderStreamResult>,
    providerId: NioProviderId,
  ): Promise<{
    result: NioProviderStreamResult | null;
    iterator: AsyncIterator<string> | null;
    first: FirstTokenResult;
  }> => {
    try {
      const result = await factory();
      const nextIterator = result.stream[Symbol.asyncIterator]();
      const remainingTimeout = Math.max(
        0,
        AI_FALLBACK_TIMEOUT_MS - (Date.now() - startedAtMs),
      );
      const first = await readFirstToken(
        nextIterator,
        remainingTimeout,
        result.provider,
      );

      return { result, iterator: nextIterator, first };
    } catch (error) {
      return {
        result: null,
        iterator: null,
        first: {
          kind: "error",
          error: normalizeProviderError(error, providerId),
        },
      };
    }
  };

  const primaryAttempt = await attemptProvider(
    () =>
      streamGemini({
        messages: args.messages,
        maxOutputTokens: args.budget.maxOutputTokens,
      }),
    "gemini",
  );

  if (
    primaryAttempt.first.kind === "token" &&
    primaryAttempt.result &&
    primaryAttempt.iterator
  ) {
    providerResult = primaryAttempt.result;
    iterator = primaryAttempt.iterator;
    firstToken = primaryAttempt.first.token;
  } else if (
    shouldFallbackForFirstToken(primaryAttempt.first, Date.now() - startedAtMs)
  ) {
    usedFallback = true;
    const fallbackReason = resolveFallbackReason(primaryAttempt.first);
    logAiFallbackEvent({
      lessonId: args.lessonId,
      threadId: args.threadId,
      fromProvider: "gemini",
      toProvider: "groq",
      reason: fallbackReason,
    }).catch(() => undefined);
    const fallbackAttempt = await attemptProvider(
      () =>
        streamGroq({
          messages: args.messages,
          maxOutputTokens: args.budget.maxOutputTokens,
        }),
      "groq",
    );

    if (
      fallbackAttempt.first.kind === "token" &&
      fallbackAttempt.result &&
      fallbackAttempt.iterator
    ) {
      providerResult = fallbackAttempt.result;
      iterator = fallbackAttempt.iterator;
      firstToken = fallbackAttempt.first.token;
    } else {
      if (fallbackAttempt.first.kind === "timeout") {
        emitErrorEvent(
          "TIMEOUT_FIRST_TOKEN",
          "Timed out waiting for first token.",
          "groq",
        );
        return;
      }

      if (fallbackAttempt.first.kind === "error") {
        emitErrorEvent(
          fallbackAttempt.first.error.code,
          fallbackAttempt.first.error.message,
          fallbackAttempt.first.error.provider ?? "groq",
        );
        return;
      }

      emitErrorEvent("STREAM_ERROR", "Provider failed before first token.");
      return;
    }
  } else {
    if (primaryAttempt.first.kind === "timeout") {
      emitErrorEvent(
        "TIMEOUT_FIRST_TOKEN",
        "Timed out waiting for first token.",
        "gemini",
      );
      return;
    }

    if (primaryAttempt.first.kind === "error") {
      emitErrorEvent(
        primaryAttempt.first.error.code,
        primaryAttempt.first.error.message,
        primaryAttempt.first.error.provider ?? "gemini",
      );
      return;
    }

    emitErrorEvent("STREAM_ERROR", "Provider failed before first token.");
    return;
  }

  if (!providerResult || !iterator || !firstToken || args.isAborted()) {
    return;
  }

  const timeToFirstTokenMs = Date.now() - startedAtMs;

  args.enqueue({
    type: "meta",
    requestId: args.requestId,
    assistantTempId: args.assistantTempId,
    provider: providerResult.provider,
    model: providerResult.model,
    startedAtMs,
    contextHash: args.contextHash,
    budget: args.budget,
    seq: 0,
  });

  let seq = 1;
  let fullText = firstToken;
  args.enqueue({
    type: "token",
    requestId: args.requestId,
    assistantTempId: args.assistantTempId,
    seq,
    token: firstToken,
  });
  seq += 1;

  try {
    while (true) {
      const { value, done } = await iterator.next();
      if (done) {
        break;
      }

      if (args.isAborted()) {
        return;
      }

      if (!value) {
        continue;
      }

      fullText += value;
      args.enqueue({
        type: "token",
        requestId: args.requestId,
        assistantTempId: args.assistantTempId,
        seq,
        token: value,
      });
      seq += 1;
    }
  } catch (error) {
    const providerError = normalizeProviderError(
      error,
      providerResult.provider,
    );
    emitErrorEvent(
      providerError.code,
      providerError.message,
      providerError.provider ?? providerResult.provider,
    );
    return;
  }

  const latencyMs = Date.now() - startedAtMs;
  args.enqueue({
    type: "done",
    requestId: args.requestId,
    assistantTempId: args.assistantTempId,
    seq,
    provider: providerResult.provider,
    model: providerResult.model,
    usedFallback,
    latencyMs,
    timeToFirstTokenMs,
    usageApprox: {
      inputChars: args.inputChars,
      outputChars: fullText.length,
    },
    finalText: fullText,
  });

  try {
    await persistAssistantMessage({
      threadId: args.threadId,
      requestId: args.requestId,
      content: fullText,
      videoTimeSec: args.videoTimeSec,
      timeWindow: args.timeWindow,
      codeHash: args.codeHash,
      provider: providerResult.provider,
      model: providerResult.model,
      latencyMs,
      usedFallback,
      contextHash: args.contextHash,
    });
  } catch {
    return;
  }
};

export const POST = async (request: Request): Promise<Response> => {
  let payload: unknown = null;

  try {
    payload = await request.json();
  } catch {
    return buildJsonResponse(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid JSON payload.",
        },
      },
      400,
    );
  }

  const validation = validateNioChatRequest(payload);

  if (!validation.ok) {
    return buildJsonResponse(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: validation.error,
        },
      },
      400,
    );
  }

  let rateLimitDecision: RateLimitDecision | null = null;

  try {
    rateLimitDecision = await consumeAiRateLimit();
  } catch {
    rateLimitDecision = null;
  }

  if (rateLimitDecision && !rateLimitDecision.ok) {
    const retryAfterMs = Math.max(rateLimitDecision.resetAtMs - Date.now(), 0);

    return buildJsonResponse(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Rate limit exceeded. Try again soon.",
        },
        retryAfterMs,
      },
      429,
      {
        "Retry-After": Math.ceil(retryAfterMs / 1000).toString(),
      },
    );
  }

  const contextResult = buildNioContext({
    systemPrompt: NIO_SYSTEM_PROMPT,
    lessonId: validation.data.lessonId,
    videoTimeSec: validation.data.videoTimeSec,
    transcript: validation.data.transcript,
    code: validation.data.code,
    recentMessages: validation.data.recentMessages,
    userMessage: validation.data.userMessage,
  });

  if (!contextResult.ok) {
    return buildJsonResponse(
      {
        error: {
          code: contextResult.code,
          message: contextResult.message,
        },
      },
      400,
    );
  }

  const contextHash = await hashString(contextResult.contextText);
  const assistantTimeWindow = {
    startSec: Math.max(0, validation.data.videoTimeSec - 60),
    endSec: validation.data.videoTimeSec + 60,
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      let aborted = false;
      let closed = false;

      const enqueue = (event: NioSseEvent): void => {
        if (closed || aborted) {
          return;
        }

        controller.enqueue(encoder.encode(encodeSseEvent(event)));
      };

      const close = (): void => {
        if (closed) {
          return;
        }

        closed = true;
        controller.close();
      };

      const abort = (): void => {
        aborted = true;
        close();
      };

      request.signal.addEventListener("abort", abort);

      const run = async (): Promise<void> => {
        if (isStubPreview()) {
          await streamStub({
            requestId: validation.data.requestId,
            assistantTempId: validation.data.assistantTempId,
            contextHash,
            inputChars: contextResult.inputChars,
            budget: contextResult.budget,
            threadId: validation.data.threadId,
            videoTimeSec: validation.data.videoTimeSec,
            timeWindow: assistantTimeWindow,
            codeHash: validation.data.code.codeHash,
            enqueue,
            isAborted: () => aborted,
          });
          close();
          return;
        }

        await streamWithProviders({
          requestId: validation.data.requestId,
          assistantTempId: validation.data.assistantTempId,
          contextHash,
          inputChars: contextResult.inputChars,
          budget: contextResult.budget,
          threadId: validation.data.threadId,
          lessonId: validation.data.lessonId,
          videoTimeSec: validation.data.videoTimeSec,
          timeWindow: assistantTimeWindow,
          codeHash: validation.data.code.codeHash,
          messages: contextResult.messages,
          enqueue,
          isAborted: () => aborted,
        });
        close();
      };

      run().catch(() => {
        enqueue({
          type: "error",
          requestId: validation.data.requestId,
          assistantTempId: validation.data.assistantTempId,
          seq: 1,
          code: "STREAM_ERROR",
          message: "Streaming failed unexpectedly.",
        });
        close();
      });
    },
    cancel() {
      return;
    },
  });

  return new Response(stream, {
    status: 200,
    headers: NIO_SSE_HEADERS,
  });
};
