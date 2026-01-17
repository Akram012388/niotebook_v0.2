type DomainId<T extends string> = string & {
  __tableName: T;
  __domain?: T;
};

type CourseId = DomainId<"courses">;

type LessonId = DomainId<"lessons">;

type ChapterId = DomainId<"chapters">;

type TranscriptSegmentId = DomainId<"transcriptSegments">;

type UserId = DomainId<"users">;

type InviteId = DomainId<"invites">;

type FrameId = DomainId<"frames">;

type CodeSnapshotId = DomainId<"codeSnapshots">;

type ChatThreadId = DomainId<"chatThreads">;

type ChatMessageId = DomainId<"chatMessages">;

type EventId = DomainId<"events">;

type RateLimitId = DomainId<"rateLimits">;

export type {
  DomainId,
  CourseId,
  LessonId,
  ChapterId,
  TranscriptSegmentId,
  UserId,
  InviteId,
  FrameId,
  CodeSnapshotId,
  ChatThreadId,
  ChatMessageId,
  EventId,
  RateLimitId,
};
