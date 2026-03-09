import { describe, expect, it } from "vitest";
import type { NioSseEvent } from "../../src/domain/nio";
import { encodeSseEvent, parseSseEvent } from "../../src/infra/ai/nioSse";

describe("nio SSE", (): void => {
  it("encodes and parses token events", (): void => {
    const event: NioSseEvent = {
      type: "token",
      requestId: "req-1",
      assistantTempId: "assistant-1",
      seq: 1,
      token: "Hello",
    };

    const encoded = encodeSseEvent(event);
    const parsed = parseSseEvent(encoded.trim());

    expect(parsed).toEqual(event);
  });
});
