import type {
  NioChatMessage,
  NioChatRequest,
  NioCodePayload,
  NioLessonMetaPayload,
  NioTranscriptPayload,
} from "../../domain/ai/types";

type ValidationSuccess = { ok: true; data: NioChatRequest };
type ValidationFailure = { ok: false; error: string };

type ValidationResult = ValidationSuccess | ValidationFailure;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isString = (value: unknown): value is string => {
  return typeof value === "string";
};

const isNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every(isString);
};

const parseChatMessage = (value: unknown): NioChatMessage | null => {
  if (!isRecord(value)) {
    return null;
  }

  const { role, content } = value;

  if ((role !== "user" && role !== "assistant") || !isString(content)) {
    return null;
  }

  return { role, content };
};

const parseTranscript = (value: unknown): NioTranscriptPayload | null => {
  if (!isRecord(value)) {
    return null;
  }

  const { startSec, endSec, lines } = value;

  if (!isNumber(startSec) || !isNumber(endSec) || !isStringArray(lines)) {
    return null;
  }

  return { startSec, endSec, lines };
};

const parseCodePayload = (value: unknown): NioCodePayload | null => {
  if (!isRecord(value)) {
    return null;
  }

  const { language, codeHash, code, fileName } = value;

  if (!isString(language)) {
    return null;
  }

  if (codeHash !== undefined && !isString(codeHash)) {
    return null;
  }

  if (code !== undefined && !isString(code)) {
    return null;
  }

  if (fileName !== undefined && !isString(fileName)) {
    return null;
  }

  return { language, codeHash, code, fileName };
};

const parseRecentMessages = (value: unknown): NioChatMessage[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsed = value.map((entry) => parseChatMessage(entry));

  if (parsed.some((entry) => entry === null)) {
    return null;
  }

  return parsed as NioChatMessage[];
};

const parseLessonMeta = (value: unknown): NioLessonMetaPayload | null => {
  if (value === undefined) {
    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const { title, lectureNumber, subtitlesUrl, transcriptUrl } = value;

  if (title !== undefined && !isString(title)) {
    return null;
  }

  if (lectureNumber !== undefined && !isNumber(lectureNumber)) {
    return null;
  }

  if (subtitlesUrl !== undefined && !isString(subtitlesUrl)) {
    return null;
  }

  if (transcriptUrl !== undefined && !isString(transcriptUrl)) {
    return null;
  }

  return {
    title,
    lectureNumber,
    subtitlesUrl,
    transcriptUrl,
  };
};

const validateNioChatRequest = (payload: unknown): ValidationResult => {
  if (!isRecord(payload)) {
    return { ok: false, error: "Request payload must be an object." };
  }

  const {
    requestId,
    assistantTempId,
    lessonId,
    threadId,
    videoTimeSec,
    userMessage,
    recentMessages,
    transcript,
    code,
    lesson,
    lastError,
  } = payload;

  if (!isString(requestId) || requestId.trim().length === 0) {
    return { ok: false, error: "requestId is required." };
  }

  if (!isString(assistantTempId) || assistantTempId.trim().length === 0) {
    return { ok: false, error: "assistantTempId is required." };
  }

  if (!isString(lessonId) || lessonId.trim().length === 0) {
    return { ok: false, error: "lessonId is required." };
  }

  if (!isString(threadId) || threadId.trim().length === 0) {
    return { ok: false, error: "threadId is required." };
  }

  if (!isNumber(videoTimeSec)) {
    return { ok: false, error: "videoTimeSec must be a number." };
  }

  if (!isString(userMessage) || userMessage.trim().length === 0) {
    return { ok: false, error: "userMessage is required." };
  }

  if (userMessage.length > 4000) {
    return { ok: false, error: "userMessage exceeds maximum length." };
  }

  const parsedMessages = parseRecentMessages(recentMessages);
  if (!parsedMessages) {
    return { ok: false, error: "recentMessages must be a valid array." };
  }

  if (parsedMessages.length > 50) {
    return { ok: false, error: "recentMessages exceeds maximum count." };
  }

  const parsedTranscript = parseTranscript(transcript);
  if (!parsedTranscript) {
    return { ok: false, error: "transcript must be provided." };
  }

  if (parsedTranscript.lines.length > 500) {
    return { ok: false, error: "transcript.lines exceeds maximum count." };
  }

  const parsedCode = parseCodePayload(code);
  if (!parsedCode) {
    return { ok: false, error: "code payload must be provided." };
  }

  if (parsedCode.code !== undefined && parsedCode.code.length > 50000) {
    return { ok: false, error: "code.code exceeds maximum length." };
  }

  const parsedLesson = parseLessonMeta(lesson);
  if (parsedLesson === null && lesson !== undefined) {
    return { ok: false, error: "lesson metadata must be valid." };
  }

  if (lastError !== undefined && !isString(lastError)) {
    return { ok: false, error: "lastError must be a string." };
  }

  return {
    ok: true,
    data: {
      requestId,
      assistantTempId,
      lessonId,
      threadId,
      videoTimeSec,
      userMessage,
      recentMessages: parsedMessages,
      transcript: parsedTranscript,
      code: parsedCode,
      lesson: parsedLesson ?? undefined,
      lastError,
    },
  };
};

export type { ValidationResult };
export { validateNioChatRequest };
