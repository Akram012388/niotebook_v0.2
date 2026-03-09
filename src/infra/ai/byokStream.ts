import { ConvexHttpClient } from "convex/browser";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import type { NioErrorCode, NioSseEvent } from "../../domain/nio";
import type { NioContextMessage } from "../../domain/nioContextBuilder";
import { streamGemini } from "./geminiStream";
import { streamOpenAI } from "./openaiStream";
import { streamAnthropic } from "./anthropicStream";
import type { NioProviderId, NioProviderStreamResult } from "./providerTypes";
import { isProviderStreamError, NioProviderStreamError } from "./providerTypes";

const STUB_PROVIDER = "stub";
const STUB_MODEL = "nio-stub";

const isConvexEnabled = (): boolean => {
  return process.env.NEXT_PUBLIC_DISABLE_CONVEX !== "true";
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

const normalizeProviderError = (
  error: unknown,
  provider: NioProviderId,
): NioProviderStreamError => {
  if (isProviderStreamError(error)) {
    return error;
  }

  return new NioProviderStreamError(
    "Provider stream error.",
    "STREAM_ERROR",
    undefined,
    provider,
  );
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

const streamWithByok = async (args: {
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

  const emitError = (code: NioErrorCode, message: string): void => {
    args.enqueue({
      type: "error",
      requestId: args.requestId,
      assistantTempId: args.assistantTempId,
      seq: 1,
      code,
      message,
    });
  };

  // Resolve user's API key from Convex
  let resolved: { provider: NioProviderId; key: string } | null = null;
  try {
    resolved = await args.client.action(api.userApiKeys.resolveForRequest, {});
  } catch (err) {
    console.error("[nio] resolveForRequest failed", err);
    emitError("STREAM_ERROR", "Failed to resolve API key.");
    return;
  }

  if (!resolved) {
    emitError("NO_API_KEY", "No API key configured. Add one in Settings.");
    return;
  }

  const { provider, key } = resolved;

  let providerResult: NioProviderStreamResult;
  try {
    if (provider === "gemini") {
      providerResult = await streamGemini({
        messages: args.messages,
        maxOutputTokens: args.budget.maxOutputTokens,
        apiKey: key,
      });
    } else if (provider === "openai") {
      providerResult = await streamOpenAI({
        messages: args.messages,
        maxOutputTokens: args.budget.maxOutputTokens,
        apiKey: key,
      });
    } else if (provider === "anthropic") {
      providerResult = await streamAnthropic({
        messages: args.messages,
        maxOutputTokens: args.budget.maxOutputTokens,
        apiKey: key,
      });
    } else {
      emitError("STREAM_ERROR", "Unknown provider.");
      return;
    }
  } catch (error) {
    if (!isProviderStreamError(error)) {
      console.error("[nio] provider stream error", error);
    }
    const providerError = normalizeProviderError(error, provider);
    args.enqueue({
      type: "error",
      requestId: args.requestId,
      assistantTempId: args.assistantTempId,
      seq: 1,
      code: providerError.code,
      message: providerError.message,
      provider: providerError.provider ?? provider,
    });
    return;
  }

  const iterator = providerResult.stream[Symbol.asyncIterator]();

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

  let fullText = "";
  let seq = 1;

  try {
    while (true) {
      const { value, done } = await iterator.next();
      if (done) break;
      if (args.isAborted()) return;
      if (!value) continue;

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
    if (!isProviderStreamError(error)) {
      console.error("[nio] stream iteration error", error);
    }
    const providerError = normalizeProviderError(
      error,
      providerResult.provider,
    );
    args.enqueue({
      type: "error",
      requestId: args.requestId,
      assistantTempId: args.assistantTempId,
      seq,
      code: providerError.code,
      message: providerError.message,
      provider: providerError.provider ?? providerResult.provider,
    });
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
    usedFallback: false,
    latencyMs,
    timeToFirstTokenMs,
    usageApprox: {
      inputChars: args.inputChars,
      outputChars: fullText.length,
    },
    finalText: fullText,
  });

  const persistArgs = {
    threadId: args.threadId,
    requestId: args.requestId,
    content: fullText,
    videoTimeSec: args.videoTimeSec,
    timeWindow: args.timeWindow,
    codeHash: args.codeHash,
    provider: providerResult.provider,
    model: providerResult.model,
    latencyMs,
    usedFallback: false,
    contextHash: args.contextHash,
    client: args.client,
  };

  void (async () => {
    try {
      await persistAssistantMessage(persistArgs);
    } catch (err) {
      console.error(
        "[nio/chat] persistAssistantMessage failed, retrying in 2s",
        {
          error: err instanceof Error ? err.message : String(err),
        },
      );
      await sleep(2000);
      try {
        await persistAssistantMessage(persistArgs);
      } catch (retryErr) {
        console.error("[nio/chat] persistAssistantMessage retry failed", {
          error:
            retryErr instanceof Error ? retryErr.message : String(retryErr),
        });
      }
    }
  })();
};

export { streamStub, streamWithByok };
