import type { GenericId } from "convex/values";
import type { InviteRole } from "./invites";
import type { RateLimitScope } from "./rate-limits";

type EventType =
  | "transcript_ingest_started"
  | "transcript_ingest_succeeded"
  | "transcript_ingest_failed"
  | "transcript_duration_warn"
  | "invite_created"
  | "invite_redeemed"
  | "rate_limit_denied"
  | "ai_fallback_triggered"
  | "lesson_completed"
  | "session_heartbeat";

type TranscriptIngestStartedMetadata = {
  lessonId: GenericId<"lessons">;
};

type TranscriptIngestSucceededMetadata = {
  lessonId: GenericId<"lessons">;
  segmentCount: number;
  transcriptDurationSec: number;
};

type TranscriptIngestFailedMetadata = {
  lessonId: GenericId<"lessons">;
  reason: string;
};

type TranscriptDurationWarnMetadata = {
  lessonId: GenericId<"lessons">;
  lessonDurationSec: number;
  transcriptDurationSec: number;
};

type InviteCreatedMetadata = {
  inviteId: GenericId<"invites">;
  inviteBatchId: string;
  role: InviteRole;
};

type InviteRedeemedMetadata = {
  inviteId: GenericId<"invites">;
  inviteBatchId: string;
  role: InviteRole;
};

type RateLimitDeniedMetadata = {
  scope: RateLimitScope;
  limit: number;
  windowMs: number;
};

type AiFallbackTriggeredMetadata = {
  reason: "status" | "timeout";
  status?: number;
  timeoutMs?: number;
};

type LessonCompletedMetadata = {
  lessonId: GenericId<"lessons">;
  completionPct?: number;
};

type SessionHeartbeatMetadata = {
  intervalMs: number;
};

type EventMetadataMap = {
  transcript_ingest_started: TranscriptIngestStartedMetadata;
  transcript_ingest_succeeded: TranscriptIngestSucceededMetadata;
  transcript_ingest_failed: TranscriptIngestFailedMetadata;
  transcript_duration_warn: TranscriptDurationWarnMetadata;
  invite_created: InviteCreatedMetadata;
  invite_redeemed: InviteRedeemedMetadata;
  rate_limit_denied: RateLimitDeniedMetadata;
  ai_fallback_triggered: AiFallbackTriggeredMetadata;
  lesson_completed: LessonCompletedMetadata;
  session_heartbeat: SessionHeartbeatMetadata;
};

type EventInput<T extends EventType = EventType> = {
  eventType: T;
  userId?: GenericId<"users">;
  lessonId?: GenericId<"lessons">;
  sessionId?: string;
  metadata: EventMetadataMap[T];
};

type EventRecord<T extends EventType = EventType> = EventInput<T> & {
  createdAt: number;
};

type EventLogErrorCode = "INVALID_EVENT_METADATA";

type EventLogError = {
  code: EventLogErrorCode;
  message: string;
};

type EventLogResult =
  | { ok: true; eventId: GenericId<"events"> }
  | { ok: false; error: EventLogError };

type EventValidationResult =
  | { ok: true }
  | { ok: false; error: EventLogError };

const EVENT_ERROR_MESSAGES: Record<EventLogErrorCode, string> = {
  INVALID_EVENT_METADATA: "Invalid event metadata."
};

const buildEventLogError = (code: EventLogErrorCode): EventLogError => {
  return {
    code,
    message: EVENT_ERROR_MESSAGES[code]
  };
};

const isNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

const isString = (value: unknown): value is string => {
  return typeof value === "string" && value.length > 0;
};

const isInviteRole = (value: unknown): value is InviteRole => {
  return value === "user" || value === "admin";
};

const isRateLimitScope = (value: unknown): value is RateLimitScope => {
  return value === "invite_redeem" || value === "ai_request";
};

const isFallbackReason = (value: unknown): value is "status" | "timeout" => {
  return value === "status" || value === "timeout";
};

const validateEventMetadata = (
  eventType: EventType,
  metadata: Record<string, unknown>
): EventValidationResult => {
  const invalid = { ok: false, error: buildEventLogError("INVALID_EVENT_METADATA") } as const;

  switch (eventType) {
    case "transcript_ingest_started":
      return isString(metadata.lessonId) ? { ok: true } : invalid;
    case "transcript_ingest_succeeded":
      return isString(metadata.lessonId) &&
        isNumber(metadata.segmentCount) &&
        isNumber(metadata.transcriptDurationSec)
        ? { ok: true }
        : invalid;
    case "transcript_ingest_failed":
      return isString(metadata.lessonId) && isString(metadata.reason)
        ? { ok: true }
        : invalid;
    case "transcript_duration_warn":
      return isString(metadata.lessonId) &&
        isNumber(metadata.lessonDurationSec) &&
        isNumber(metadata.transcriptDurationSec)
        ? { ok: true }
        : invalid;
    case "invite_created":
      return isString(metadata.inviteId) &&
        isString(metadata.inviteBatchId) &&
        isInviteRole(metadata.role)
        ? { ok: true }
        : invalid;
    case "invite_redeemed":
      return isString(metadata.inviteId) &&
        isString(metadata.inviteBatchId) &&
        isInviteRole(metadata.role)
        ? { ok: true }
        : invalid;
    case "rate_limit_denied":
      return isRateLimitScope(metadata.scope) &&
        isNumber(metadata.limit) &&
        isNumber(metadata.windowMs)
        ? { ok: true }
        : invalid;
    case "ai_fallback_triggered":
      if (!isFallbackReason(metadata.reason)) {
        return invalid;
      }

      if (metadata.reason === "status") {
        return isNumber(metadata.status) ? { ok: true } : invalid;
      }

      return isNumber(metadata.timeoutMs) ? { ok: true } : invalid;
    case "lesson_completed":
      return isString(metadata.lessonId) ? { ok: true } : invalid;
    case "session_heartbeat":
      return isNumber(metadata.intervalMs) ? { ok: true } : invalid;
    default:
      return invalid;
  }
};

export type {
  EventInput,
  EventLogError,
  EventLogErrorCode,
  EventLogResult,
  EventMetadataMap,
  EventRecord,
  EventType
};
export { buildEventLogError, validateEventMetadata };
