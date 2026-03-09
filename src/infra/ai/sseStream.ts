/**
 * Shared SSE read-loop for AI provider streams.
 * Reads chunks from a ReadableStream, buffers lines, strips SSE framing,
 * and yields tokens extracted by the caller-supplied parseToken function.
 *
 * @param body        - The raw ReadableStream from the fetch response body.
 * @param parseToken  - Provider-specific function that receives a parsed JSON
 *                      value and returns a token string, or null to skip.
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
        const trimmed = line.trim();
        if (!trimmed) continue;

        let payloadText: string;

        if (trimmed.startsWith("data:")) {
          payloadText = trimmed.slice("data:".length).trim();
        } else if (allowRawJson) {
          payloadText = trimmed;
        } else {
          continue;
        }

        if (!payloadText || payloadText === "[DONE]") continue;

        let parsed: unknown;
        try {
          parsed = JSON.parse(payloadText);
        } catch {
          continue;
        }

        const token = parseToken(parsed);
        if (token) yield token;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
