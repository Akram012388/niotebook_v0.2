import type { NioContextMessage } from "../../domain/nioContextBuilder";
import type { NioProviderStreamResult } from "./providerTypes";
import {
  createProviderStreamError,
  NioProviderStreamError,
} from "./providerTypes";

type GroqStreamInput = {
  messages: NioContextMessage[];
  maxOutputTokens: number;
};

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const parseGroqToken = (payload: unknown): string | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const choices = payload.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return null;
  }

  const first = choices[0];
  if (!isRecord(first)) {
    return null;
  }

  const delta = first.delta;
  if (!isRecord(delta)) {
    return null;
  }

  const content = delta.content;
  if (typeof content !== "string") {
    return null;
  }

  return content;
};

const streamGroq = async (
  input: GroqStreamInput,
): Promise<NioProviderStreamResult> => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw createProviderStreamError("Groq API key is missing.");
  }

  const body = {
    model: GROQ_MODEL,
    stream: true,
    max_tokens: input.maxOutputTokens,
    temperature: 0.2,
    messages: input.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  let response: Response;
  try {
    response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    throw createProviderStreamError(
      controller.signal.aborted
        ? "Groq request timed out."
        : `Groq fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      0,
      "groq",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw createProviderStreamError(
      `Groq request failed with status ${response.status}.`,
      response.status,
      "groq",
    );
  }

  if (!response.body) {
    throw new NioProviderStreamError(
      "Groq response stream missing.",
      "STREAM_ERROR",
      response.status,
      "groq",
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
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() ?? "";

      for (const chunk of chunks) {
        const lines = chunk.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) {
            continue;
          }

          const payloadText = trimmed.slice("data:".length).trim();
          if (!payloadText || payloadText === "[DONE]") {
            continue;
          }

          let parsed: unknown = null;

          try {
            parsed = JSON.parse(payloadText);
          } catch {
            continue;
          }

          const token = parseGroqToken(parsed);
          if (token) {
            yield token;
          }
        }
      }
    }
  })();

  return {
    provider: "groq",
    model: GROQ_MODEL,
    stream,
  };
};

export { streamGroq, GROQ_MODEL };
