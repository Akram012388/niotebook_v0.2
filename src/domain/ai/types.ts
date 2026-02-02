type NioChatMessageRole = "user" | "assistant";

type NioChatMessage = {
  role: NioChatMessageRole;
  content: string;
};

type NioTranscriptPayload = {
  startSec: number;
  endSec: number;
  lines: string[];
};

type NioCodePayload = {
  language: string;
  codeHash?: string;
  code?: string;
  fileName?: string;
};

type NioLessonMetaPayload = {
  title?: string;
  lectureNumber?: number;
  subtitlesUrl?: string;
  transcriptUrl?: string;
};

type NioChatRequest = {
  requestId: string;
  assistantTempId: string;
  lessonId: string;
  threadId: string;
  videoTimeSec: number;
  userMessage: string;
  recentMessages: NioChatMessage[];
  transcript: NioTranscriptPayload;
  code: NioCodePayload;
  lesson?: NioLessonMetaPayload;
  lastError?: string;
};

type NioErrorCode =
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "PROVIDER_429"
  | "PROVIDER_5XX"
  | "TIMEOUT_FIRST_TOKEN"
  | "STREAM_ERROR";

type NioSseMetaEvent = {
  type: "meta";
  requestId: string;
  assistantTempId: string;
  provider: string;
  model: string;
  startedAtMs: number;
  contextHash: string;
  budget: {
    maxOutputTokens: number;
    maxContextTokens: number;
    approxCharBudget: number;
  };
  seq: number;
};

type NioSseTokenEvent = {
  type: "token";
  requestId: string;
  assistantTempId: string;
  seq: number;
  token: string;
};

type NioSseDoneEvent = {
  type: "done";
  requestId: string;
  assistantTempId: string;
  seq: number;
  provider: string;
  model: string;
  usedFallback: boolean;
  latencyMs: number;
  timeToFirstTokenMs: number;
  usageApprox: {
    inputChars: number;
    outputChars: number;
  };
  finalText: string;
};

type NioSseErrorEvent = {
  type: "error";
  requestId: string;
  assistantTempId: string;
  seq: number;
  code: NioErrorCode;
  message: string;
  provider?: string;
};

type NioSseEvent =
  | NioSseMetaEvent
  | NioSseTokenEvent
  | NioSseDoneEvent
  | NioSseErrorEvent;

export type {
  NioChatMessage,
  NioChatMessageRole,
  NioChatRequest,
  NioCodePayload,
  NioErrorCode,
  NioLessonMetaPayload,
  NioSseDoneEvent,
  NioSseErrorEvent,
  NioSseEvent,
  NioSseMetaEvent,
  NioSseTokenEvent,
  NioTranscriptPayload,
};
