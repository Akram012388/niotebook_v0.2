type RateLimitScope = "invite_redeem" | "ai_request" | "event_log" | "feedback";

type RateLimitRecord = {
  scope: RateLimitScope;
  subject: string;
  windowStartMs: number;
  count: number;
};

type RateLimitDecision = {
  ok: boolean;
  remaining: number;
  resetAtMs: number;
  limit: number;
};

type RateLimitEvaluation = {
  record: RateLimitRecord;
  decision: RateLimitDecision;
};

const INVITE_REDEEM_WINDOW_MS = 60 * 60 * 1000;
const INVITE_REDEEM_LIMIT = 5;
const AI_REQUEST_WINDOW_MS = 10 * 60 * 1000;
const AI_REQUEST_LIMIT = 20;
const EVENT_LOG_WINDOW_MS = 60 * 1000; // 1 minute
const EVENT_LOG_LIMIT = 100;
const FEEDBACK_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const FEEDBACK_LIMIT = 5;

const evaluateRateLimit = (
  scope: RateLimitScope,
  subject: string,
  existing: RateLimitRecord | null,
  nowMs: number,
  windowMs: number,
  limit: number,
): RateLimitEvaluation => {
  const isSameWindow =
    existing !== null && nowMs - existing.windowStartMs < windowMs;
  const windowStartMs = isSameWindow ? existing.windowStartMs : nowMs;
  const count = isSameWindow ? existing.count + 1 : 1;

  const decision: RateLimitDecision = {
    ok: count <= limit,
    remaining: Math.max(limit - count, 0),
    resetAtMs: windowStartMs + windowMs,
    limit,
  };

  return {
    record: {
      scope,
      subject,
      windowStartMs,
      count,
    },
    decision,
  };
};

export type {
  RateLimitDecision,
  RateLimitEvaluation,
  RateLimitRecord,
  RateLimitScope,
};
export {
  AI_REQUEST_LIMIT,
  AI_REQUEST_WINDOW_MS,
  EVENT_LOG_LIMIT,
  EVENT_LOG_WINDOW_MS,
  FEEDBACK_LIMIT,
  FEEDBACK_WINDOW_MS,
  INVITE_REDEEM_LIMIT,
  INVITE_REDEEM_WINDOW_MS,
  evaluateRateLimit,
};
