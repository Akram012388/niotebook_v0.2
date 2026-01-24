import type { NioSseEvent } from "../../domain/ai/types";

const NIO_SSE_HEADERS: Record<string, string> = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

const encodeSseEvent = (event: NioSseEvent): string => {
  const payload = JSON.stringify(event);
  const dataLines = payload.split("\n");
  const data = dataLines.map((line) => `data: ${line}`).join("\n");
  return `event: ${event.type}\n${data}\n\n`;
};

export { encodeSseEvent, NIO_SSE_HEADERS };
