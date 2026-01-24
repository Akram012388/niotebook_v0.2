import type {
  ChatThreadId,
  CourseId,
  EventId,
  InviteId,
  LessonId,
  UserId,
} from "./ids";

type EventType =
  | "invite_issued"
  | "invite_redeemed"
  | "magic_link_sent"
  | "magic_link_verified"
  | "course_selected"
  | "lesson_started"
  | "video_play"
  | "video_pause"
  | "video_seek"
  | "code_edit"
  | "code_run"
  | "nio_message_sent"
  | "nio_message_received"
  | "ai_fallback_triggered"
  | "lesson_completed"
  | "session_start"
  | "session_end"
  | "runtime_warmup_start"
  | "runtime_warmup_end"
  | "transcript_ingest_started"
  | "transcript_ingest_succeeded"
  | "transcript_ingest_failed"
  | "transcript_duration_warn"
  | "share_opened"
  | "share_copy"
  | "share_social"
  | "feedback_opened"
  | "feedback_submitted"
  | "feedback_dismissed";

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

type TranscriptIngestStartedMetadata = {
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
  transcript_ingest_started: TranscriptIngestStartedMetadata;
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

const EVENT_METADATA_VALIDATORS: Record<EventType, EventMetadataValidator> = {
  invite_issued: (metadata) =>
    metadata.inviteId && metadata.createdBy
      ? { ok: true }
      : invalidEventMetadata(),
  invite_redeemed: (metadata) =>
    metadata.inviteId && metadata.redeemedBy
      ? { ok: true }
      : invalidEventMetadata(),
  magic_link_sent: (metadata) =>
    metadata.emailHash ? { ok: true } : invalidEventMetadata(),
  magic_link_verified: (metadata) =>
    metadata.userId ? { ok: true } : invalidEventMetadata(),
  course_selected: (metadata) =>
    metadata.courseId ? { ok: true } : invalidEventMetadata(),
  lesson_started: (metadata) =>
    metadata.courseId && metadata.lessonId
      ? { ok: true }
      : invalidEventMetadata(),
  video_play: (metadata) =>
    metadata.lessonId && typeof metadata.videoTimeSec === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  video_pause: (metadata) =>
    metadata.lessonId && typeof metadata.videoTimeSec === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  video_seek: (metadata) =>
    metadata.lessonId && typeof metadata.videoTimeSec === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  code_edit: (metadata) =>
    metadata.lessonId && metadata.language
      ? { ok: true }
      : invalidEventMetadata(),
  code_run: (metadata) =>
    metadata.lessonId &&
    metadata.language &&
    typeof metadata.success === "boolean" &&
    typeof metadata.runtimeMs === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  nio_message_sent: (metadata) =>
    metadata.lessonId && metadata.threadId
      ? { ok: true }
      : invalidEventMetadata(),
  nio_message_received: (metadata) =>
    metadata.lessonId &&
    metadata.threadId &&
    typeof metadata.latencyMs === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  ai_fallback_triggered: (metadata) =>
    metadata.lessonId &&
    metadata.threadId &&
    metadata.fromProvider &&
    metadata.toProvider &&
    metadata.reason
      ? { ok: true }
      : invalidEventMetadata(),
  lesson_completed: (metadata) =>
    metadata.lessonId ? { ok: true } : invalidEventMetadata(),
  session_start: (metadata) =>
    metadata.sessionId && typeof metadata.durationMs === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  session_end: (metadata) =>
    metadata.sessionId && typeof metadata.durationMs === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  runtime_warmup_start: (metadata) =>
    metadata.language && typeof metadata.durationMs === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  runtime_warmup_end: (metadata) =>
    metadata.language && typeof metadata.durationMs === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  transcript_ingest_started: (metadata) =>
    metadata.lessonId ? { ok: true } : invalidEventMetadata(),
  transcript_ingest_succeeded: (metadata) =>
    metadata.lessonId &&
    typeof metadata.segmentCount === "number" &&
    typeof metadata.transcriptDurationSec === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  transcript_ingest_failed: (metadata) =>
    metadata.lessonId && metadata.reason
      ? { ok: true }
      : invalidEventMetadata(),
  transcript_duration_warn: (metadata) =>
    metadata.lessonId &&
    typeof metadata.lessonDurationSec === "number" &&
    typeof metadata.transcriptDurationSec === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  share_opened: (metadata) =>
    metadata.surface ? { ok: true } : invalidEventMetadata(),
  share_copy: (metadata) =>
    metadata.surface ? { ok: true } : invalidEventMetadata(),
  share_social: (metadata) =>
    metadata.surface && metadata.network
      ? { ok: true }
      : invalidEventMetadata(),
  feedback_opened: (metadata) =>
    metadata.surface ? { ok: true } : invalidEventMetadata(),
  feedback_submitted: (metadata) =>
    metadata.surface &&
    typeof metadata.rating === "number" &&
    typeof metadata.textLength === "number"
      ? { ok: true }
      : invalidEventMetadata(),
  feedback_dismissed: (metadata) =>
    metadata.surface ? { ok: true } : invalidEventMetadata(),
};

const buildEventLogError = (code: EventLogErrorCode): EventLogError => {
  const message =
    code === "MISSING_USER_ID"
      ? "User id is required."
      : "Invalid event metadata.";

  return {
    code,
    message,
  };
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
    return invalidEventMetadata();
  }

  return validator(metadata);
};

const validateEventUserId = (userId?: UserId): EventValidationResult => {
  if (!userId) {
    return { ok: false, error: buildEventLogError("MISSING_USER_ID") };
  }

  return { ok: true };
};

const EVENT_TYPES = Object.keys(EVENT_METADATA_VALIDATORS) as EventType[];

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
