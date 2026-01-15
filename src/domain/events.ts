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

export type { EventInput, EventMetadataMap, EventRecord, EventType };
