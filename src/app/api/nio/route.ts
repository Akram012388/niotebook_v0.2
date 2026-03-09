import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import type { RateLimitDecision } from "../../../domain/rate-limits";
import type { NioSseEvent } from "../../../domain/nio";
import { buildNioContext } from "../../../domain/nioContextBuilder";
import { NIO_SYSTEM_PROMPT } from "../../../domain/nioPrompt";
import { encodeSseEvent, NIO_SSE_HEADERS } from "../../../infra/ai/nioSse";
import { neutralizePromptInjection } from "../../../infra/ai/promptInjection";
import { fetchSubtitleWindow } from "../../../infra/ai/subtitleFallback";
import { fetchYoutubeTranscriptWindow } from "../../../infra/ai/youtubeTranscriptFallback";
import { validateNioChatRequest } from "../../../infra/ai/validateNioChatRequest";
import { hashString } from "../../../infra/hash";
import { resolveLectureNumber } from "../../../domain/lectureNumber";
import { streamStub, streamWithByok } from "../../../infra/ai/byokStream";
import {
  fetchTranscriptWindow,
  fetchLessonMeta,
} from "../../../infra/ai/transcriptResolver";

type ErrorBody = {
  error: {
    code: string;
    message: string;
  };
  retryAfterMs?: number;
};

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

  if (process.env.NIOTEBOOK_DEV_AUTH_BYPASS === "true") {
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

  // TODO: Client-side auth token interpolation can produce "Bearer undefined" before
  // the token is available. Fix on the client side; this guard is a temporary server-side
  // safety net.
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

const consumeAiRateLimit = async (
  client: ConvexHttpClient,
): Promise<RateLimitDecision | null> => {
  if (!isConvexEnabled()) {
    return null;
  }

  return client.mutation(api.rateLimits.consumeAiRateLimit, {});
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
    return buildJsonResponse(
      {
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Service temporarily unavailable. Please try again.",
        },
      },
      503,
    );
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
    videoId?: string;
  } | null = validation.data.lesson
    ? {
        title: validation.data.lesson.title,
        lectureNumber: validation.data.lesson.lectureNumber,
        subtitlesUrl: validation.data.lesson.subtitlesUrl,
        transcriptUrl: validation.data.lesson.transcriptUrl,
      }
    : null;

  // Always fetch lesson meta server-side to avoid stale client data
  const needsTranscript = !hasTranscriptLines && isConvexEnabled();
  const needsLessonMeta = isConvexEnabled();

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
      console.error("[nio] transcript fetch failed", {
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
      console.error("[nio] lesson meta fetch failed", {
        requestId: validation.data.requestId,
        error:
          lessonMetaResult.reason instanceof Error
            ? lessonMetaResult.reason.message
            : String(lessonMetaResult.reason),
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
  } else if (!transcriptPayload.lines.some((line) => line.trim().length > 0)) {
    debugLog("transcript: no SRT fallback available", {
      requestId: validation.data.requestId,
      hasLessonMeta: Boolean(lessonMeta),
      subtitlesUrl: lessonMeta?.subtitlesUrl ?? "none",
    });
  }

  // YouTube transcript fallback (for courses without SRT files, e.g. CS50R)
  if (
    !transcriptPayload.lines.some((line) => line.trim().length > 0) &&
    lessonMeta?.videoId
  ) {
    debugLog("transcript: attempting YouTube fallback", {
      requestId: validation.data.requestId,
      videoId: lessonMeta.videoId,
    });
    try {
      const lines = await fetchYoutubeTranscriptWindow({
        videoId: lessonMeta.videoId,
        startSec: transcriptPayload.startSec,
        endSec: transcriptPayload.endSec,
      });
      debugLog("transcript: YouTube fallback result", {
        requestId: validation.data.requestId,
        lineCount: lines.length,
      });
      if (lines.length > 0) {
        transcriptPayload = { ...transcriptPayload, lines };
      }
    } catch (err) {
      debugLog("transcript: YouTube fallback failed", {
        requestId: validation.data.requestId,
        videoId: lessonMeta.videoId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
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
    lastError: validation.data.lastError,
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

        await streamWithByok({
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

      let streamTimeoutHandle: ReturnType<typeof setTimeout> | undefined;
      const streamTimeoutPromise = new Promise<never>((_, reject) => {
        streamTimeoutHandle = setTimeout(
          () => reject(new Error("Stream body timeout")),
          120_000,
        );
      });

      Promise.race([
        run().finally(() => {
          clearTimeout(streamTimeoutHandle);
        }),
        streamTimeoutPromise,
      ]).catch(() => {
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
