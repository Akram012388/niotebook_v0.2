import type { NioContextMessage } from "../../domain/nioContextBuilder";
import type { NioProviderStreamResult } from "./providerTypes";
import { createProviderStreamError, NioProviderStreamError } from "./providerTypes";

type AnthropicStreamInput = {
  messages: NioContextMessage[];
  maxOutputTokens: number;
  apiKey: string;
};

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";

const streamAnthropic = async (
  input: AnthropicStreamInput,
): Promise<NioProviderStreamResult> => {
  const systemMessages = input.messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");

  const conversationMessages = input.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: input.maxOutputTokens,
    ...(systemMessages ? { system: systemMessages } : {}),
    messages: conversationMessages,
    stream: true,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": input.apiKey,
        "anthropic-version": ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    throw createProviderStreamError(
      controller.signal.aborted
        ? "Anthropic request timed out."
        : `Anthropic fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      0,
      "anthropic",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw createProviderStreamError(
      `Anthropic request failed with status ${response.status}.`,
      response.status,
      "anthropic",
    );
  }

  if (!response.body) {
    throw new NioProviderStreamError(
      "Anthropic response stream missing.",
      "STREAM_ERROR",
      response.status,
      "anthropic",
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
        if (!trimmed.startsWith("data:")) continue;

        const payload = trimmed.slice("data:".length).trim();

        let parsed: unknown;
        try {
          parsed = JSON.parse(payload);
        } catch {
          continue;
        }

        // Anthropic streams content_block_delta events
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          (parsed as { type?: string }).type === "content_block_delta" &&
          typeof (parsed as { delta?: { text?: string } }).delta?.text === "string"
        ) {
          const text = (parsed as { delta: { text: string } }).delta.text;
          if (text) yield text;
        }
      }
    }
  })();

  return {
    provider: "anthropic",
    model: ANTHROPIC_MODEL,
    stream,
  };
};

export { streamAnthropic, ANTHROPIC_MODEL };
