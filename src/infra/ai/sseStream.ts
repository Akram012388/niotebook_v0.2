/**
 * Parse a single SSE line into a token string.
 *
 * Strips SSE `data:` framing, parses the JSON payload, and delegates to
 * the caller-supplied parseToken function to extract a token.
 */
function parseSseLine(
  line: string,
  parseToken: (parsed: unknown) => string | null,
  allowRawJson: boolean,
): string | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  let payloadText: string;

  if (trimmed.startsWith("data:")) {
    payloadText = trimmed.slice("data:".length).trim();
  } else if (allowRawJson) {
    payloadText = trimmed;
  } else {
    return null;
  }

  if (!payloadText || payloadText === "[DONE]") return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(payloadText);
  } catch {
    if (process.env.NIO_DEBUG === "1") {
      console.warn(
        "[sseStream] Failed to parse SSE payload:",
        payloadText.slice(0, 100),
      );
    }
    return null;
  }

  return parseToken(parsed);
}

/**
 * Shared SSE read-loop for AI provider streams.
 * Reads chunks from a ReadableStream, buffers lines, strips SSE framing,
 * and yields tokens extracted by the caller-supplied parseToken function.
 *
 * @param body        - The raw ReadableStream from the fetch response body.
 * @param parseToken  - Provider-specific function that receives a parsed JSON
 *                      value and returns a non-empty token string, or null/empty string to skip.
 * @param allowRawJson - When true, lines without a `data:` prefix are also
 *                      attempted as raw JSON (needed for Gemini alt=sse mode).
 */
export async function* readSseStream(
  body: ReadableStream<Uint8Array>,
  parseToken: (parsed: unknown) => string | null,
  allowRawJson = false,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const token = parseSseLine(line, parseToken, allowRawJson);
        if (token) yield token;
      }
    }

    // Flush any remaining buffer content (incomplete final line without
    // a trailing newline).
    if (buffer.length > 0) {
      const token = parseSseLine(buffer, parseToken, allowRawJson);
      if (token) yield token;
    }
  } finally {
    reader.releaseLock();
  }
}
