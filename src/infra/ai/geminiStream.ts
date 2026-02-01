import type { NioContextMessage } from "../../domain/nioContextBuilder";
import type { NioProviderStreamResult } from "./providerTypes";
import {
  createProviderStreamError,
  NioProviderStreamError,
} from "./providerTypes";

type GeminiStreamInput = {
  messages: NioContextMessage[];
  maxOutputTokens: number;
};

const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const parseGeminiToken = (payload: unknown): string | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const candidates = payload.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  const first = candidates[0];
  if (!isRecord(first)) {
    return null;
  }

  const content = first.content;
  if (!isRecord(content)) {
    return null;
  }

  const parts = content.parts;
  if (!Array.isArray(parts) || parts.length === 0) {
    return null;
  }

  const part = parts[0];
  if (!isRecord(part)) {
    return null;
  }

  const text = part.text;
  if (typeof text !== "string") {
    return null;
  }

  return text;
};

const streamGemini = async (
  input: GeminiStreamInput,
): Promise<NioProviderStreamResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isDebug = process.env.NIO_DEBUG === "1";
  const debugLog = (message: string, data?: Record<string, unknown>): void => {
    if (!isDebug) {
      return;
    }

    if (data) {
      console.log(`[nio:gemini] ${message}`, data);
      return;
    }

    console.log(`[nio:gemini] ${message}`);
  };

  if (!apiKey) {
    throw createProviderStreamError("Gemini API key is missing.");
  }

  const systemMessages = input.messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");

  const contents = input.messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

  const body = {
    contents,
    generationConfig: {
      maxOutputTokens: input.maxOutputTokens,
    },
    ...(systemMessages
      ? { system_instruction: { parts: [{ text: systemMessages }] } }
      : {}),
  };

  const requestUrl = `${GEMINI_API_BASE}/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;
  debugLog("request", { model: GEMINI_MODEL, url: requestUrl });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  let response: Response;
  try {
    response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    throw createProviderStreamError(
      controller.signal.aborted
        ? "Gemini request timed out."
        : `Gemini fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      0,
      "gemini",
    );
  } finally {
    clearTimeout(timeout);
  }

  debugLog("response", { status: response.status });

  if (!response.ok) {
    if (isDebug) {
      try {
        const clone = response.clone();
        const text = await clone.text();
        debugLog("error body", { preview: text.slice(0, 200) });
      } catch {
        debugLog("error body", { preview: "<unavailable>" });
      }
    }
    throw createProviderStreamError(
      `Gemini request failed with status ${response.status}.`,
      response.status,
      "gemini",
    );
  }

  if (!response.body) {
    throw new NioProviderStreamError(
      "Gemini response stream missing.",
      "STREAM_ERROR",
      response.status,
      "gemini",
    );
  }

  const responseBody = response.body;

  const stream = (async function* () {
    const reader = responseBody.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let sawToken = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }

        const payloadText = trimmed.startsWith("data:")
          ? trimmed.slice("data:".length).trim()
          : trimmed;

        if (!payloadText || payloadText === "[DONE]") {
          continue;
        }

        let parsed: unknown = null;

        try {
          parsed = JSON.parse(payloadText);
        } catch {
          continue;
        }

        const token = parseGeminiToken(parsed);
        if (token) {
          if (!sawToken) {
            sawToken = true;
            debugLog("first token", { length: token.length });
          }
          yield token;
        }
      }
    }
  })();

  return {
    provider: "gemini",
    model: GEMINI_MODEL,
    stream,
  };
};

export { streamGemini, GEMINI_MODEL };
