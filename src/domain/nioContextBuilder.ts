import type {
  NioChatMessage,
  NioCodePayload,
  NioErrorCode,
  NioTranscriptPayload,
} from "./ai/types";

type NioContextMessageRole = "system" | "user" | "assistant";

type NioContextMessage = {
  role: NioContextMessageRole;
  content: string;
};

type NioContextBuildInput = {
  systemPrompt: string;
  lessonId: string;
  lessonTitle?: string;
  lectureNumber?: number;
  videoTimeSec: number;
  transcript: NioTranscriptPayload;
  code: NioCodePayload;
  recentMessages: NioChatMessage[];
  userMessage: string;
  lastError?: string;
};

type NioContextBudget = {
  maxOutputTokens: number;
  maxContextTokens: number;
  approxCharBudget: number;
};

type NioContextBuildSuccess = {
  ok: true;
  messages: NioContextMessage[];
  contextText: string;
  inputChars: number;
  budget: NioContextBudget;
};

type NioContextBuildFailure = {
  ok: false;
  code: NioErrorCode;
  message: string;
};

type NioContextBuildResult = NioContextBuildSuccess | NioContextBuildFailure;

const MAX_OUTPUT_TOKENS = 1024;
const MAX_CONTEXT_TOKENS = 3072;
const APPROX_CONTEXT_CHAR_BUDGET = 12_288;
const SAFETY_MARGIN_CHARS = 512;

const formatTimestamp = (timestampSec: number): string => {
  const hours = Math.floor(timestampSec / 3600);
  const minutes = Math.floor((timestampSec % 3600) / 60);
  const seconds = Math.floor(timestampSec % 60);
  const paddedMinutes = minutes.toString().padStart(2, "0");
  const paddedSeconds = seconds.toString().padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${minutes}:${paddedSeconds}`;
};

const buildTranscriptBlock = (lines: string[]): string => {
  if (lines.length === 0) {
    return "Transcript context isn't available for this moment.";
  }

  return lines.join("\n");
};

const buildCodeBlock = (code: string | undefined): string => {
  if (!code || code.trim().length === 0) {
    return "No code snapshot available.";
  }

  return code;
};

const buildContextMessage = (input: {
  lessonId: string;
  lessonTitle?: string;
  lectureNumber?: number;
  videoTimeSec: number;
  transcript: NioTranscriptPayload;
  transcriptText: string;
  code: NioCodePayload;
  codeText: string;
  lastError?: string;
}): string => {
  const {
    lessonId,
    lessonTitle,
    lectureNumber,
    videoTimeSec,
    transcript,
    transcriptText,
    code,
    codeText,
  } = input;
  const videoTimestamp = formatTimestamp(videoTimeSec);
  const windowStart = formatTimestamp(transcript.startSec);
  const windowEnd = formatTimestamp(transcript.endSec);
  const lectureLabel = (() => {
    if (lectureNumber !== undefined && lessonTitle) {
      return `Lecture ${lectureNumber}: ${lessonTitle}`;
    }

    if (lectureNumber !== undefined) {
      return `Lecture ${lectureNumber}`;
    }

    if (lessonTitle) {
      return `Lecture: ${lessonTitle}`;
    }

    return `Lesson: ${lessonId}`;
  })();
  const fileNamePart = code.fileName ? ` • ${code.fileName}` : "";
  const codeLabel = code.codeHash
    ? `Code (${code.language}${fileNamePart} • ${code.codeHash})`
    : `Code (${code.language}${fileNamePart})`;

  const lines = [
    lectureLabel,
    `Video time: ${videoTimestamp} (${Math.floor(videoTimeSec)}s)`,
    `Transcript window: ${windowStart} - ${windowEnd} (±60s)`,
    "Transcript (untrusted context):",
    transcriptText,
    codeLabel + ":",
    codeText,
  ];

  if (input.lastError) {
    lines.push("Last run error:", input.lastError);
  }

  return lines.join("\n");
};

const serializeMessages = (messages: NioContextMessage[]): string => {
  return messages
    .map((message) => `${message.role.toUpperCase()}:\n${message.content}`)
    .join("\n\n");
};

const sumMessageChars = (messages: NioContextMessage[]): number => {
  return messages.reduce((total, message) => total + message.content.length, 0);
};

const dropOldestMessages = (
  messages: NioChatMessage[],
  buildTotal: (nextMessages: NioChatMessage[]) => number,
  maxChars: number,
): NioChatMessage[] => {
  let trimmed = [...messages];

  while (trimmed.length > 0 && buildTotal(trimmed) > maxChars) {
    trimmed = trimmed.slice(1);
  }

  return trimmed;
};

const truncateString = (value: string, maxChars: number): string => {
  if (value.length <= maxChars) {
    return value;
  }

  if (maxChars <= 0) {
    return "";
  }

  return value.slice(0, maxChars);
};

const buildNioContext = (
  input: NioContextBuildInput,
): NioContextBuildResult => {
  const maxChars = APPROX_CONTEXT_CHAR_BUDGET - SAFETY_MARGIN_CHARS;

  if (input.systemPrompt.length > maxChars) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "System prompt exceeds context budget.",
    };
  }

  const transcriptBase = buildTranscriptBlock(input.transcript.lines);
  const codeBase = buildCodeBlock(input.code.code);

  let transcriptText = transcriptBase;
  let codeText = codeBase;
  let history = [...input.recentMessages];

  const buildTotalChars = (nextHistory: NioChatMessage[]): number => {
    const contextMessage = buildContextMessage({
      lessonId: input.lessonId,
      lessonTitle: input.lessonTitle,
      lectureNumber: input.lectureNumber,
      videoTimeSec: input.videoTimeSec,
      transcript: input.transcript,
      transcriptText,
      code: input.code,
      codeText,
      lastError: input.lastError,
    });

    const contextMessages: NioContextMessage[] = [
      { role: "system", content: input.systemPrompt },
      { role: "system", content: contextMessage },
      ...nextHistory,
      { role: "user", content: input.userMessage },
    ];

    return sumMessageChars(contextMessages);
  };

  if (buildTotalChars(history) > maxChars) {
    history = dropOldestMessages(history, buildTotalChars, maxChars);
  }

  let totalChars = buildTotalChars(history);

  if (totalChars > maxChars) {
    const overage = totalChars - maxChars;
    transcriptText = truncateString(
      transcriptText,
      transcriptText.length - overage,
    );
    totalChars = buildTotalChars(history);
  }

  if (totalChars > maxChars) {
    const overage = totalChars - maxChars;
    codeText = truncateString(codeText, codeText.length - overage);
    totalChars = buildTotalChars(history);
  }

  if (totalChars > maxChars) {
    history = dropOldestMessages(history, buildTotalChars, maxChars);
    totalChars = buildTotalChars(history);
  }

  if (totalChars > maxChars) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Request exceeds context budget.",
    };
  }

  const contextMessage = buildContextMessage({
    lessonId: input.lessonId,
    lessonTitle: input.lessonTitle,
    lectureNumber: input.lectureNumber,
    videoTimeSec: input.videoTimeSec,
    transcript: input.transcript,
    transcriptText,
    code: input.code,
    codeText,
    lastError: input.lastError,
  });

  const messages: NioContextMessage[] = [
    { role: "system", content: input.systemPrompt },
    { role: "system", content: contextMessage },
    ...history,
    { role: "user", content: input.userMessage },
  ];

  const contextText = serializeMessages(messages);

  return {
    ok: true,
    messages,
    contextText,
    inputChars: totalChars,
    budget: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      maxContextTokens: MAX_CONTEXT_TOKENS,
      approxCharBudget: APPROX_CONTEXT_CHAR_BUDGET,
    },
  };
};

export type {
  NioContextBuildInput,
  NioContextBuildResult,
  NioContextMessage,
  NioContextMessageRole,
};
export {
  APPROX_CONTEXT_CHAR_BUDGET,
  MAX_CONTEXT_TOKENS,
  MAX_OUTPUT_TOKENS,
  SAFETY_MARGIN_CHARS,
  buildNioContext,
};
