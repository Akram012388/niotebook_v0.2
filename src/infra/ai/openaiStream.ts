import type { NioContextMessage } from "../../domain/nioContextBuilder";
import type { NioProviderStreamResult } from "./providerTypes";
import { createProviderStreamError, NioProviderStreamError } from "./providerTypes";

type OpenAIStreamInput = {
  messages: NioContextMessage[];
  maxOutputTokens: number;
  apiKey: string;
};

const OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const toOpenAIRole = (role: string): "system" | "user" | "assistant" => {
  if (role === "system") return "system";
  if (role === "assistant") return "assistant";
  return "user";
};

const streamOpenAI = async (
  input: OpenAIStreamInput,
): Promise<NioProviderStreamResult> => {
  const body = {
    model: OPENAI_MODEL,
    messages: input.messages.map((m) => ({
      role: toOpenAIRole(m.role),
      content: m.content,
    })),
    max_tokens: input.maxOutputTokens,
    stream: true,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  let response: Response;
  try {
    response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    throw createProviderStreamError(
      controller.signal.aborted
        ? "OpenAI request timed out."
        : `OpenAI fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      0,
      "openai",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw createProviderStreamError(
      `OpenAI request failed with status ${response.status}.`,
      response.status,
      "openai",
    );
  }

  if (!response.body) {
    throw new NioProviderStreamError(
      "OpenAI response stream missing.",
      "STREAM_ERROR",
      response.status,
      "openai",
    );
  }

  const responseBody = response.body;

  const stream = (async function* () {
    const reader = responseBody.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const payload = trimmed.slice("data:".length).trim();
        if (payload === "[DONE]") return;

        let parsed: unknown;
        try {
          parsed = JSON.parse(payload);
        } catch {
          continue;
        }

        const token =
          typeof parsed === "object" &&
          parsed !== null &&
          "choices" in parsed &&
          Array.isArray((parsed as { choices: unknown[] }).choices) &&
          (parsed as { choices: { delta?: { content?: string } }[] }).choices[0]
            ?.delta?.content;

        if (typeof token === "string" && token) {
          yield token;
        }
      }
    }
  })();

  return {
    provider: "openai",
    model: OPENAI_MODEL,
    stream,
  };
};

export { streamOpenAI, OPENAI_MODEL };
