import { describe, expect, it } from "vitest";
import type { NioChatRequest } from "../../src/domain/ai/types";
import { parseSseEvent } from "../../src/infra/ai/nioSse";
import { POST } from "../../src/app/api/nio/route";

const readStream = async (response: Response): Promise<string> => {
  if (!response.body) {
    throw new Error("Response body missing.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    result += decoder.decode(value, { stream: true });
  }

  result += decoder.decode();
  return result;
};

describe("nio route SSE", (): void => {
  it("streams stub meta, token, done", async (): Promise<void> => {
    const prevPreview = process.env.NIOTEBOOK_E2E_PREVIEW;
    const prevDisableConvex = process.env.NEXT_PUBLIC_DISABLE_CONVEX;
    process.env.NIOTEBOOK_E2E_PREVIEW = "true";
    process.env.NEXT_PUBLIC_DISABLE_CONVEX = "true";

    try {
      const payload: NioChatRequest = {
        requestId: "req-1",
        assistantTempId: "assistant-1",
        lessonId: "lesson-1",
        threadId: "thread-1",
        videoTimeSec: 42,
        userMessage: "What is a pointer?",
        recentMessages: [],
        transcript: {
          startSec: 0,
          endSec: 60,
          lines: ["Today we learn pointers."],
        },
        code: {
          language: "c",
          code: "int main(void) { return 0; }",
          codeHash: "hash-1",
        },
      };

      const request = new Request("http://localhost/api/nio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const raw = await readStream(response);
      const events = raw
        .split("\n\n")
        .map((chunk) => chunk.trim())
        .filter((chunk) => chunk.length > 0)
        .map((chunk) => parseSseEvent(chunk))
        .filter((event): event is NonNullable<typeof event> => event !== null);

      expect(events[0]?.type).toBe("meta");
      expect(events.some((event) => event.type === "token")).toBe(true);
      expect(events.at(-1)?.type).toBe("done");
    } finally {
      if (prevPreview === undefined) {
        delete process.env.NIOTEBOOK_E2E_PREVIEW;
      } else {
        process.env.NIOTEBOOK_E2E_PREVIEW = prevPreview;
      }
      if (prevDisableConvex === undefined) {
        delete process.env.NEXT_PUBLIC_DISABLE_CONVEX;
      } else {
        process.env.NEXT_PUBLIC_DISABLE_CONVEX = prevDisableConvex;
      }
    }
  });
});
