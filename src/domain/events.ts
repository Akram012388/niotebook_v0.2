import type {
  ChatThreadId,
  CourseId,
  EventId,
  InviteId,
  LessonId,
  UserId,
} from "./ids";

const EVENT_TYPES = [
  "invite_issued",
  "invite_redeemed",
  "magic_link_sent",
  "magic_link_verified",
  "course_selected",
  "lesson_started",
  "video_play",
  "video_pause",
  "video_seek",
  "code_edit",
  "code_run",
  "nio_message_sent",
  "nio_message_received",
  "ai_fallback_triggered",
  "lesson_completed",
  "session_start",
  "session_end",
  "runtime_warmup_start",
  "runtime_warmup_end",
  "transcript_ingest_completed",
  "transcript_ingest_succeeded",
  "transcript_ingest_failed",
  "transcript_duration_warn",
  "share_opened",
  "share_copy",
  "share_social",
  "feedback_opened",
  "feedback_submitted",
  "feedback_dismissed",
] as const;

type EventType = (typeof EVENT_TYPES)[number];

type InviteIssuedMetadata = {
  inviteId: InviteId;
  createdBy: UserId;
};

type InviteRedeemedMetadata = {
  inviteId: InviteId;
  redeemedBy: UserId;
};

type MagicLinkSentMetadata = {
  emailHash: string;
};

type MagicLinkVerifiedMetadata = {
  userId: UserId;
};

type CourseSelectedMetadata = {
  courseId: CourseId;
};

type LessonStartedMetadata = {
  courseId: CourseId;
  lessonId: LessonId;
};

type VideoEventMetadata = {
  lessonId: LessonId;
  videoTimeSec: number;
};

type CodeEditMetadata = {
  lessonId: LessonId;
  language: string;
};

type CodeRunMetadata = {
  lessonId: LessonId;
  language: string;
  success: boolean;
  runtimeMs: number;
};

type NioMessageMetadata = {
  lessonId: LessonId;
  threadId: ChatThreadId;
};

type NioMessageReceivedMetadata = NioMessageMetadata & {
  latencyMs: number;
};

type AiFallbackTriggeredMetadata = {
  lessonId: LessonId;
  threadId: ChatThreadId;
  fromProvider: string;
  toProvider: string;
  reason: string;
};

type LessonCompletedMetadata = {
  lessonId: LessonId;
  completionPct?: number;
};

type SessionEventMetadata = {
  sessionId: string;
  durationMs: number;
};

type RuntimeWarmupMetadata = {
  language: string;
  durationMs: number;
};

type TranscriptIngestCompletedMetadata = {
  lessonId: LessonId;
};

type TranscriptIngestSucceededMetadata = {
  lessonId: LessonId;
  segmentCount: number;
  transcriptDurationSec: number;
};

type TranscriptIngestFailedMetadata = {
  lessonId: LessonId;
  reason: string;
};

type TranscriptDurationWarnMetadata = {
  lessonId: LessonId;
  lessonDurationSec: number;
  transcriptDurationSec: number;
};

type ShareMetadata = {
  surface: string;
};

type ShareSocialMetadata = {
  surface: string;
  network: string;
};

type FeedbackOpenedMetadata = {
  surface: string;
};

type FeedbackSubmittedMetadata = {
  surface: string;
  rating: number;
  textLength: number;
};

type FeedbackDismissedMetadata = {
  surface: string;
};

type EventMetadataMap = {
  invite_issued: InviteIssuedMetadata;
  invite_redeemed: InviteRedeemedMetadata;
  magic_link_sent: MagicLinkSentMetadata;
  magic_link_verified: MagicLinkVerifiedMetadata;
  course_selected: CourseSelectedMetadata;
  lesson_started: LessonStartedMetadata;
  video_play: VideoEventMetadata;
  video_pause: VideoEventMetadata;
  video_seek: VideoEventMetadata;
  code_edit: CodeEditMetadata;
  code_run: CodeRunMetadata;
  nio_message_sent: NioMessageMetadata;
  nio_message_received: NioMessageReceivedMetadata;
  ai_fallback_triggered: AiFallbackTriggeredMetadata;
  lesson_completed: LessonCompletedMetadata;
  session_start: SessionEventMetadata;
  session_end: SessionEventMetadata;
  runtime_warmup_start: RuntimeWarmupMetadata;
  runtime_warmup_end: RuntimeWarmupMetadata;
  transcript_ingest_completed: TranscriptIngestCompletedMetadata;
  transcript_ingest_succeeded: TranscriptIngestSucceededMetadata;
  transcript_ingest_failed: TranscriptIngestFailedMetadata;
  transcript_duration_warn: TranscriptDurationWarnMetadata;
  share_opened: ShareMetadata;
  share_copy: ShareMetadata;
  share_social: ShareSocialMetadata;
  feedback_opened: FeedbackOpenedMetadata;
  feedback_submitted: FeedbackSubmittedMetadata;
  feedback_dismissed: FeedbackDismissedMetadata;
};

type EventInput<T extends EventType = EventType> = {
  eventType: T;
  userId: UserId;
  lessonId?: LessonId;
  sessionId?: string;
  metadata: EventMetadataMap[T];
};

type EventRecord<T extends EventType = EventType> = EventInput<T> & {
  createdAt: number;
};

type EventLogErrorCode = "INVALID_EVENT_METADATA" | "MISSING_USER_ID";

type EventLogError = {
  code: EventLogErrorCode;
  message: string;
};

type EventLogResult =
  | { ok: true; eventId: EventId }
  | { ok: false; error: EventLogError };

type EventValidationResult = { ok: true } | { ok: false; error: EventLogError };

type EventMetadataInput = Record<string, string | number | boolean | undefined>;

type EventMetadataValidator = (
  metadata: EventMetadataInput,
) => EventValidationResult;

const isStr = (val: string | number | boolean | undefined): val is string =>
  typeof val === "string" && val.length > 0;

const EVENT_METADATA_VALIDATORS: Record<EventType, EventMetadataValidator> = {
  invite_issued: (metadata) =>
    isStr(metadata.inviteId) && isStr(metadata.createdBy)
      ? { ok: true }
      : invalidEventMetadata(),
  invite_redeemed: (metadata) =>
    isStr(metadata.inviteId) && isStr(metadata.redeemedBy)
      ? { ok: true }
      : invalidEventMetadata(),
  magic_link_sent: (metadata) =>
    isStr(metadata.emailHash) ? { ok: true } : invalidEventMetadata(),
  magic_link_verified: (metadata) =>
    isStr(metadata.userId) ? { ok: true } : invalidEventMetadata(),
  course_selected: (metadata) =>
    isStr(metadata.courseId) ? { ok: true } : invalidEventMetadata(),
  lesson_started: (metadata) =>
    isStr(metadata.courseId) && isStr(metadata.lessonId)
      ? { ok: true }
      : invalidEventMetadata(),
  video_play: (metadata) =>
    isStr(metadata.lessonId) && typeof metadata.videoTimeSec === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  video_pause: (metadata) =>
    isStr(metadata.lessonId) && typeof metadata.videoTimeSec === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  video_seek: (metadata) =>
    isStr(metadata.lessonId) && typeof metadata.videoTimeSec === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  code_edit: (metadata) =>
    isStr(metadata.lessonId) && isStr(metadata.language)
      ? { ok: true }
      : invalidEventMetadata(),
  code_run: (metadata) =>
    isStr(metadata.lessonId) &&
    isStr(metadata.language) &&
    typeof metadata.success === "boolean" &&
    typeof metadata.runtimeMs === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  nio_message_sent: (metadata) =>
    isStr(metadata.lessonId) && isStr(metadata.threadId)
      ? { ok: true }
      : invalidEventMetadata(),
  nio_message_received: (metadata) =>
    isStr(metadata.lessonId) &&
    isStr(metadata.threadId) &&
    typeof metadata.latencyMs === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  ai_fallback_triggered: (metadata) =>
    isStr(metadata.lessonId) &&
    isStr(metadata.threadId) &&
    isStr(metadata.fromProvider) &&
    isStr(metadata.toProvider) &&
    isStr(metadata.reason)
      ? { ok: true }
      : invalidEventMetadata(),
  lesson_completed: (metadata) =>
    isStr(metadata.lessonId) ? { ok: true } : invalidEventMetadata(),
  session_start: (metadata) =>
    isStr(metadata.sessionId) && typeof metadata.durationMs === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  session_end: (metadata) =>
    isStr(metadata.sessionId) && typeof metadata.durationMs === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  runtime_warmup_start: (metadata) =>
    isStr(metadata.language) && typeof metadata.durationMs === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  runtime_warmup_end: (metadata) =>
    isStr(metadata.language) && typeof metadata.durationMs === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  transcript_ingest_completed: (metadata) =>
    isStr(metadata.lessonId) ? { ok: true } : invalidEventMetadata(),
  transcript_ingest_succeeded: (metadata) =>
    isStr(metadata.lessonId) &&
    typeof metadata.segmentCount === "number" &&
    typeof metadata.transcriptDurationSec === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  transcript_ingest_failed: (metadata) =>
    isStr(metadata.lessonId) && isStr(metadata.reason)
      ? { ok: true }
      : invalidEventMetadata(),
  transcript_duration_warn: (metadata) =>
    isStr(metadata.lessonId) &&
    typeof metadata.lessonDurationSec === "number" &&
    typeof metadata.transcriptDurationSec === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  share_opened: (metadata) =>
    isStr(metadata.surface) ? { ok: true } : invalidEventMetadata(),
  share_copy: (metadata) =>
    isStr(metadata.surface) ? { ok: true } : invalidEventMetadata(),
  share_social: (metadata) =>
    isStr(metadata.surface) && isStr(metadata.network)
      ? { ok: true }
      : invalidEventMetadata(),
  feedback_opened: (metadata) =>
    isStr(metadata.surface) ? { ok: true } : invalidEventMetadata(),
  feedback_submitted: (metadata) =>
    isStr(metadata.surface) &&
    typeof metadata.rating === "number" &&
    typeof metadata.textLength === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  feedback_dismissed: (metadata) =>
    isStr(metadata.surface) ? { ok: true } : invalidEventMetadata(),
};

const buildEventLogError = (
  code: EventLogErrorCode,
  detail?: string,
): EventLogError => {
  const baseMessage =
    code === "MISSING_USER_ID"
      ? "User id is required."
      : "Invalid event metadata.";

  const message = detail ? `${baseMessage} (${detail})` : baseMessage;

  return { code, message };
};

const invalidEventMetadata = (): EventValidationResult => {
  return { ok: false, error: buildEventLogError("INVALID_EVENT_METADATA") };
};

const validateEventMetadata = (
  eventType: EventType,
  metadata: EventMetadataInput,
): EventValidationResult => {
  const validator = EVENT_METADATA_VALIDATORS[eventType];

  if (!validator) {
    return {
      ok: false,
      error: buildEventLogError("INVALID_EVENT_METADATA", eventType),
    };
  }

  const result = validator(metadata);

  if (!result.ok) {
    return {
      ok: false,
      error: buildEventLogError("INVALID_EVENT_METADATA", eventType),
    };
  }

  return result;
};

const validateEventUserId = (userId?: UserId): EventValidationResult => {
  if (!userId) {
    return { ok: false, error: buildEventLogError("MISSING_USER_ID") };
  }

  return { ok: true };
};

const isEventType = (value: string): value is EventType => {
  return EVENT_TYPES.includes(value as EventType);
};

export type {
  EventInput,
  EventLogError,
  EventLogErrorCode,
  EventLogResult,
  EventMetadataMap,
  EventRecord,
  EventType,
};
export {
  EVENT_TYPES,
  buildEventLogError,
  isEventType,
  validateEventMetadata,
  validateEventUserId,
};
