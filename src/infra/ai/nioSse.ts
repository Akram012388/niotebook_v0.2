import type { NioErrorCode, NioSseEvent } from "../../domain/ai/types";
import { isRecord, isString, isNumber } from "./typeGuards";

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

const isBoolean = (value: unknown): value is boolean => {
  return typeof value === "boolean";
};

const isErrorCode = (value: unknown): value is NioErrorCode => {
  return (
    value === "NO_API_KEY" ||
    value === "AUTH_REQUIRED" ||
    value === "RATE_LIMITED" ||
    value === "VALIDATION_ERROR" ||
    value === "PROVIDER_429" ||
    value === "PROVIDER_5XX" ||
    value === "TIMEOUT_FIRST_TOKEN" ||
    value === "STREAM_ERROR"
  );
};

const parseMetaEvent = (
  payload: Record<string, unknown>,
): NioSseEvent | null => {
  const {
    requestId,
    assistantTempId,
    provider,
    model,
    startedAtMs,
    contextHash,
    budget,
    seq,
  } = payload;

  if (
    !isString(requestId) ||
    !isString(assistantTempId) ||
    !isString(provider) ||
    !isString(model) ||
    !isNumber(startedAtMs) ||
    !isString(contextHash) ||
    !isNumber(seq) ||
    !isRecord(budget)
  ) {
    return null;
  }

  const { maxOutputTokens, maxContextTokens, approxCharBudget } = budget;

  if (
    !isNumber(maxOutputTokens) ||
    !isNumber(maxContextTokens) ||
    !isNumber(approxCharBudget)
  ) {
    return null;
  }

  return {
    type: "meta",
    requestId,
    assistantTempId,
    provider,
    model,
    startedAtMs,
    contextHash,
    budget: {
      maxOutputTokens,
      maxContextTokens,
      approxCharBudget,
    },
    seq,
  };
};

const parseTokenEvent = (
  payload: Record<string, unknown>,
): NioSseEvent | null => {
  const { requestId, assistantTempId, seq, token } = payload;

  if (
    !isString(requestId) ||
    !isString(assistantTempId) ||
    !isNumber(seq) ||
    !isString(token)
  ) {
    return null;
  }

  return {
    type: "token",
    requestId,
    assistantTempId,
    seq,
    token,
  };
};

const parseDoneEvent = (
  payload: Record<string, unknown>,
): NioSseEvent | null => {
  const {
    requestId,
    assistantTempId,
    seq,
    provider,
    model,
    usedFallback,
    latencyMs,
    timeToFirstTokenMs,
    usageApprox,
    finalText,
  } = payload;

  if (
    !isString(requestId) ||
    !isString(assistantTempId) ||
    !isNumber(seq) ||
    !isString(provider) ||
    !isString(model) ||
    !isBoolean(usedFallback) ||
    !isNumber(latencyMs) ||
    !isNumber(timeToFirstTokenMs) ||
    !isString(finalText) ||
    !isRecord(usageApprox)
  ) {
    return null;
  }

  const { inputChars, outputChars } = usageApprox;

  if (!isNumber(inputChars) || !isNumber(outputChars)) {
    return null;
  }

  return {
    type: "done",
    requestId,
    assistantTempId,
    seq,
    provider,
    model,
    usedFallback,
    latencyMs,
    timeToFirstTokenMs,
    usageApprox: { inputChars, outputChars },
    finalText,
  };
};

const parseErrorEvent = (
  payload: Record<string, unknown>,
): NioSseEvent | null => {
  const { requestId, assistantTempId, seq, code, message, provider } = payload;

  if (
    !isString(requestId) ||
    !isString(assistantTempId) ||
    !isNumber(seq) ||
    !isErrorCode(code) ||
    !isString(message)
  ) {
    return null;
  }

  if (provider !== undefined && !isString(provider)) {
    return null;
  }

  return {
    type: "error",
    requestId,
    assistantTempId,
    seq,
    code,
    message,
    provider,
  };
};

const parseSseEvent = (rawEvent: string): NioSseEvent | null => {
  const lines = rawEvent.split("\n");
  let eventType: string | null = null;
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventType = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  }

  if (!eventType || dataLines.length === 0) {
    return null;
  }

  let parsed: unknown = null;

  try {
    parsed = JSON.parse(dataLines.join("\n"));
  } catch {
    return null;
  }

  if (!isRecord(parsed) || parsed.type !== eventType) {
    return null;
  }

  switch (eventType) {
    case "meta":
      return parseMetaEvent(parsed);
    case "token":
      return parseTokenEvent(parsed);
    case "done":
      return parseDoneEvent(parsed);
    case "error":
      return parseErrorEvent(parsed);
    default:
      return null;
  }
};

export { encodeSseEvent, parseSseEvent, NIO_SSE_HEADERS };
