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

  const response = await fetch(
    `${GEMINI_API_BASE}/${GEMINI_MODEL}:streamGenerateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
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
