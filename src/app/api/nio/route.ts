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
import { neutralizePromptInjection } from "../../../infra/ai/promptInjection";
import { fetchSubtitleWindow } from "../../../infra/ai/subtitleFallback";
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
import { resolveLectureNumber } from "../../../domain/lectureNumber";

type ErrorBody = {
  error: {
    code: string;
    message: string;
  };
  retryAfterMs?: number;
};

const STUB_PROVIDER = "stub";
const STUB_MODEL = "nio-stub";
const isDebug = process.env.NIO_DEBUG === "1";

const debugLog = (message: string, data?: Record<string, unknown>): void => {
  if (!isDebug) {
    return;
  }

  if (data) {
    console.log(`[nio] ${message}`, data);
    return;
  }

  console.log(`[nio] ${message}`);
};

const isStubPreview = (): boolean => {
  return (
    process.env.NIOTEBOOK_E2E_PREVIEW === "true" ||
    process.env.NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW === "true"
  );
};

const isConvexEnabled = (): boolean => {
  return process.env.NEXT_PUBLIC_DISABLE_CONVEX !== "true";
};

const isConvexAuthRequired = (): boolean => {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  if (process.env.NIOTEBOOK_E2E_PREVIEW === "true") {
    return false;
  }

  if (
    process.env.NIOTEBOOK_DEV_AUTH_BYPASS === "true" ||
    process.env.NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS === "true"
  ) {
    return false;
  }

  return true;
};

const resolveConvexUrl = (): string => {
  return (
    process.env.NEXT_PUBLIC_CONVEX_URL ??
    process.env.CONVEX_URL ??
    "http://localhost:3210"
  );
};

const resolveConvexAuthHeader = (request: Request): string | null => {
  const header = request.headers.get("authorization");
  if (!header) {
    return null;
  }

  const trimmed = header.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.includes("undefined") || trimmed.includes("null")) {
    return null;
  }

  if (trimmed.startsWith("Bearer ") || trimmed.startsWith("Convex ")) {
    return trimmed;
  }

  return `Bearer ${trimmed}`;
};

const createConvexClient = (authHeader?: string | null): ConvexHttpClient => {
  if (!authHeader) {
    return new ConvexHttpClient(resolveConvexUrl(), {
      skipConvexDeploymentUrlCheck: true,
    });
  }

  const fetchWithAuth: typeof fetch = (input, init) => {
    const headers = new Headers(init?.headers ?? {});
    headers.set("Authorization", authHeader);
    return fetch(input, { ...init, headers });
  };

  return new ConvexHttpClient(resolveConvexUrl(), {
    skipConvexDeploymentUrlCheck: true,
    fetch: fetchWithAuth,
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

const consumeAiRateLimit = async (
  client: ConvexHttpClient,
): Promise<RateLimitDecision | null> => {
  if (!isConvexEnabled()) {
    return null;
  }

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
  client: ConvexHttpClient;
}): Promise<void> => {
  if (!isConvexEnabled()) {
    return;
  }

  await args.client.mutation(api.chat.completeAssistantMessage, {
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
  client: ConvexHttpClient;
}): Promise<void> => {
  if (!isConvexEnabled()) {
    return;
  }

  await args.client.mutation(api.events.logEvent, {
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
  client: ConvexHttpClient;
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

  // Fire-and-forget: don't block stream close on persistence
  void persistAssistantMessage({
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
    client: args.client,
  }).catch((error) => {
    console.error("[nio] stub persistence failed", error);
  });
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
  client: ConvexHttpClient;
  enqueue: (event: NioSseEvent) => void;
  isAborted: () => boolean;
}): Promise<void> => {
  const startedAtMs = Date.now();
  let usedFallback = false;
  let providerResult: NioProviderStreamResult | null = null;
  let iterator: AsyncIterator<string> | null = null;
  let firstToken: string | null = null;
  let seq = 1;

  const emitErrorEvent = (
    code: NioErrorCode,
    message: string,
    provider?: NioProviderId,
  ): void => {
    args.enqueue({
      type: "error",
      requestId: args.requestId,
      assistantTempId: args.assistantTempId,
      seq,
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

  debugLog("gemini attempt", { requestId: args.requestId });
  const primaryAttempt = await attemptProvider(
    () =>
      streamGemini({
        messages: args.messages,
        maxOutputTokens: args.budget.maxOutputTokens,
      }),
    "gemini",
  );

  if (primaryAttempt.first.kind === "token") {
    debugLog("gemini first token", {
      requestId: args.requestId,
      elapsedMs: Date.now() - startedAtMs,
    });
  }

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
    debugLog("fallback decision", {
      requestId: args.requestId,
      reason: fallbackReason,
      elapsedMs: Date.now() - startedAtMs,
      hasToken: primaryAttempt.first.kind === "token",
    });
    logAiFallbackEvent({
      lessonId: args.lessonId,
      threadId: args.threadId,
      fromProvider: "gemini",
      toProvider: "groq",
      reason: fallbackReason,
      client: args.client,
    }).catch((error) => {
      console.error("[nio] fallback event failed", error);
    });
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
      debugLog("gemini timeout", {
        requestId: args.requestId,
        elapsedMs: Date.now() - startedAtMs,
      });
      emitErrorEvent(
        "TIMEOUT_FIRST_TOKEN",
        "Timed out waiting for first token.",
        "gemini",
      );
      return;
    }

    if (primaryAttempt.first.kind === "error") {
      debugLog("gemini error", {
        requestId: args.requestId,
        name: primaryAttempt.first.error.name,
        message: primaryAttempt.first.error.message,
        stack: primaryAttempt.first.error.stack
          ?.split("\n")
          .slice(0, 4)
          .join(" | "),
      });
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

  // Fire-and-forget: don't block stream close on persistence
  void persistAssistantMessage({
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
    client: args.client,
  }).catch((error) => {
    console.error("[nio] assistant persistence failed", error);
  });
};

const fetchTranscriptWindow = async (args: {
  lessonId: string;
  startSec: number;
  endSec: number;
  client: ConvexHttpClient;
}): Promise<string[]> => {
  if (!isConvexEnabled()) {
    return [];
  }

  const segments = await args.client.query(api.transcripts.getTranscriptWindow, {
    lessonId: args.lessonId as Id<"lessons">,
    startSec: args.startSec,
    endSec: args.endSec,
  });

  return segments.map((segment) => segment.textNormalized);
};

const fetchLessonMeta = async (args: {
  lessonId: string;
  client: ConvexHttpClient;
}): Promise<{
  title?: string;
  order?: number;
  lectureNumber?: number;
  subtitlesUrl?: string;
  transcriptUrl?: string;
} | null> => {
  if (!isConvexEnabled()) {
    return null;
  }

  const lesson = await args.client.query(api.content.getLesson, {
    lessonId: args.lessonId as Id<"lessons">,
  });

  if (!lesson) {
    return null;
  }

  const lectureNumber = resolveLectureNumber({
    subtitlesUrl: lesson.subtitlesUrl,
    transcriptUrl: lesson.transcriptUrl,
    title: lesson.title,
    order: lesson.order,
  });

  return {
    title: lesson.title,
    order: lesson.order,
    lectureNumber: lectureNumber ?? undefined,
    subtitlesUrl: lesson.subtitlesUrl,
    transcriptUrl: lesson.transcriptUrl,
  };
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

  debugLog("nio request", {
    requestId: validation.data.requestId,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasGroqKey: Boolean(process.env.GROQ_API_KEY),
    stubMode: isStubPreview(),
    disableConvex: process.env.NEXT_PUBLIC_DISABLE_CONVEX === "true",
  });

  const convexAuthHeader = resolveConvexAuthHeader(request);

  if (isConvexEnabled() && isConvexAuthRequired() && !convexAuthHeader) {
    return buildJsonResponse(
      {
        error: {
          code: "AUTH_REQUIRED",
          message: "Authentication required for assistant requests.",
        },
      },
      401,
    );
  }

  const convexClient = createConvexClient(convexAuthHeader);

  let rateLimitDecision: RateLimitDecision | null = null;

  try {
    rateLimitDecision = await consumeAiRateLimit(convexClient);
  } catch (error) {
    console.error("[nio] rate limit check failed", error);
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

  const sanitizedUser = neutralizePromptInjection(validation.data.userMessage);
  const sanitizedHistory = validation.data.recentMessages.map((message) =>
    message.role === "user"
      ? {
          ...message,
          content: neutralizePromptInjection(message.content).text,
        }
      : message,
  );

  if (sanitizedUser.flagged) {
    debugLog("prompt injection neutralized", {
      requestId: validation.data.requestId,
    });
  }

  let transcriptPayload = validation.data.transcript;

  const hasTranscriptLines = transcriptPayload.lines.some(
    (line) => line.trim().length > 0,
  );

  debugLog("transcript: client payload", {
    requestId: validation.data.requestId,
    lineCount: transcriptPayload.lines.length,
    hasContent: hasTranscriptLines,
    startSec: transcriptPayload.startSec,
    endSec: transcriptPayload.endSec,
  });

  let lessonMeta: {
    title?: string;
    order?: number;
    lectureNumber?: number;
    subtitlesUrl?: string;
    transcriptUrl?: string;
  } | null = validation.data.lesson
    ? {
        title: validation.data.lesson.title,
        lectureNumber: validation.data.lesson.lectureNumber,
        subtitlesUrl: validation.data.lesson.subtitlesUrl,
        transcriptUrl: validation.data.lesson.transcriptUrl,
      }
    : null;

  // Fetch transcript and lesson meta in parallel when both are needed
  const needsTranscript = !hasTranscriptLines && isConvexEnabled();
  const needsLessonMeta = !lessonMeta && isConvexEnabled();

  if (needsTranscript || needsLessonMeta) {
    const [transcriptResult, lessonMetaResult] = await Promise.allSettled([
      needsTranscript
        ? fetchTranscriptWindow({
            lessonId: validation.data.lessonId,
            startSec: transcriptPayload.startSec,
            endSec: transcriptPayload.endSec,
            client: convexClient,
          })
        : Promise.resolve(null),
      needsLessonMeta
        ? fetchLessonMeta({
            lessonId: validation.data.lessonId,
            client: convexClient,
          })
        : Promise.resolve(null),
    ]);

    if (transcriptResult.status === "fulfilled" && transcriptResult.value) {
      const lines = transcriptResult.value;
      debugLog("transcript: convex fetch result", {
        requestId: validation.data.requestId,
        lineCount: lines.length,
      });
      if (lines.length > 0) {
        transcriptPayload = { ...transcriptPayload, lines };
      }
    } else if (transcriptResult.status === "rejected") {
      debugLog("transcript: convex fetch failed", {
        requestId: validation.data.requestId,
        error:
          transcriptResult.reason instanceof Error
            ? transcriptResult.reason.message
            : String(transcriptResult.reason),
      });
    }

    if (lessonMetaResult.status === "fulfilled" && lessonMetaResult.value) {
      lessonMeta = lessonMetaResult.value;
    } else if (lessonMetaResult.status === "rejected") {
      debugLog("lesson meta fetch failed", {
        requestId: validation.data.requestId,
      });
    }
  }

  if (lessonMeta && lessonMeta.lectureNumber === undefined) {
    lessonMeta.lectureNumber =
      resolveLectureNumber({
        subtitlesUrl: lessonMeta.subtitlesUrl,
        transcriptUrl: lessonMeta.transcriptUrl,
        title: lessonMeta.title,
        order: lessonMeta.order,
      }) ?? undefined;
  }

  if (
    !transcriptPayload.lines.some((line) => line.trim().length > 0) &&
    lessonMeta?.subtitlesUrl
  ) {
    debugLog("transcript: attempting SRT fallback", {
      requestId: validation.data.requestId,
      subtitlesUrl: lessonMeta.subtitlesUrl,
    });
    try {
      const lines = await fetchSubtitleWindow({
        subtitlesUrl: lessonMeta.subtitlesUrl,
        startSec: transcriptPayload.startSec,
        endSec: transcriptPayload.endSec,
      });
      debugLog("transcript: SRT fallback result", {
        requestId: validation.data.requestId,
        lineCount: lines.length,
      });
      if (lines.length > 0) {
        transcriptPayload = {
          ...transcriptPayload,
          lines,
        };
      }
    } catch (err) {
      debugLog("transcript: SRT fallback failed", {
        requestId: validation.data.requestId,
        subtitlesUrl: lessonMeta.subtitlesUrl,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  } else if (
    !transcriptPayload.lines.some((line) => line.trim().length > 0)
  ) {
    debugLog("transcript: no SRT fallback available", {
      requestId: validation.data.requestId,
      hasLessonMeta: Boolean(lessonMeta),
      subtitlesUrl: lessonMeta?.subtitlesUrl ?? "none",
    });
  }

  if (!transcriptPayload.lines.some((line) => line.trim().length > 0)) {
    console.warn("[nio] all transcript sources empty", {
      requestId: validation.data.requestId,
      lessonId: validation.data.lessonId,
      clientLines: validation.data.transcript.lines.length,
      subtitlesUrl: lessonMeta?.subtitlesUrl ?? "none",
    });
  }

  const contextResult = buildNioContext({
    systemPrompt: NIO_SYSTEM_PROMPT,
    lessonId: validation.data.lessonId,
    lessonTitle: lessonMeta?.title,
    lectureNumber: lessonMeta?.lectureNumber,
    videoTimeSec: validation.data.videoTimeSec,
    transcript: transcriptPayload,
    code: validation.data.code,
    recentMessages: sanitizedHistory,
    userMessage: sanitizedUser.text,
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
      let lastSeq = 0;

      const enqueue = (event: NioSseEvent): void => {
        if (closed || aborted) {
          return;
        }

        if (event.type !== "meta") {
          lastSeq = event.seq;
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
            client: convexClient,
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
          client: convexClient,
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
          seq: Math.max(1, lastSeq + 1),
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
