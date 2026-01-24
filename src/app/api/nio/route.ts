import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import type { RateLimitDecision } from "../../../domain/rate-limits";
import type { NioSseEvent } from "../../../domain/ai/types";
import { buildNioContext } from "../../../domain/nioContextBuilder";
import { NIO_SYSTEM_PROMPT } from "../../../domain/nioPrompt";
import { encodeSseEvent, NIO_SSE_HEADERS } from "../../../infra/ai/nioSse";
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

  if (!isStubPreview()) {
    return buildJsonResponse(
      {
        error: {
          code: "STREAM_ERROR",
          message: "No AI provider configured for this environment.",
        },
      },
      503,
    );
  }

  const contextHash = await hashString(contextResult.contextText);

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
        await streamStub({
          requestId: validation.data.requestId,
          assistantTempId: validation.data.assistantTempId,
          contextHash,
          inputChars: contextResult.inputChars,
          budget: contextResult.budget,
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
