# API Reference: POST /api/nio

## Overview

`POST /api/nio` is the AI chat endpoint that powers the Nio assistant inside the workspace. It accepts a lesson context payload and returns a Server-Sent Events (SSE) stream of tokens and control events.

This is an **internal-only** endpoint. The client (`src/ui/chat/useChatThread.ts`) and server (`src/app/api/nio/route.ts`) are co-deployed as a single Next.js application; this is not a public API and is not intended for external consumers.

---

## Authentication

The client fetches a Clerk JWT using `getToken({ template: "convex" })` and sends it in the `Authorization` header:

```
Authorization: Bearer <clerk-jwt>
```

Authentication is enforced in production. In development (`NODE_ENV !== "production"`), in E2E preview mode (`NIOTEBOOK_E2E_PREVIEW=true` or `NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW=true`), or when `NIOTEBOOK_DEV_AUTH_BYPASS=true` (or its `NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS` variant), the auth check is skipped.

If the header is absent or malformed in production, the server returns `401 AUTH_REQUIRED`.

---

## Rate Limits

| Scope        | Limit | Window    |
|--------------|-------|-----------|
| `ai_request` | 20    | 10 minutes |

Rate limits are tracked per authenticated user via Convex (`rateLimits.consumeAiRateLimit`). When the limit is exceeded the server returns `429 RATE_LIMITED` with:

- Response body field `retryAfterMs` — milliseconds until the window resets.
- `Retry-After` response header — seconds until the window resets (ceiling of `retryAfterMs / 1000`).

---

## Request

**Method:** `POST`
**Path:** `/api/nio`
**Content-Type:** `application/json`

### Body: `NioChatRequest`

| Field | Type | Required | Description |
|---|---|---|---|
| `requestId` | `string` | Yes | Client-generated UUID for the request. Echoed back in all SSE events. |
| `assistantTempId` | `string` | Yes | Client-generated UUID for the pending assistant message. Used to match SSE events to the local optimistic message. |
| `lessonId` | `string` | Yes | Convex document ID of the current lesson. |
| `threadId` | `string` | Yes | Convex document ID of the chat thread (or `"local-thread"` when Convex is unavailable). |
| `videoTimeSec` | `number` | Yes | Current video playback position in seconds. |
| `userMessage` | `string` | Yes | The user's message text. |
| `recentMessages` | `NioChatMessage[]` | Yes | Up to 20 most recent messages for conversation context. See below. |
| `transcript` | `NioTranscriptPayload` | Yes | Transcript window around the current video position. See below. |
| `code` | `NioCodePayload` | Yes | Current editor state. See below. |
| `lesson` | `NioLessonMetaPayload` | No | Lesson metadata. The server also fetches this from Convex; the client value may be stale. |
| `lastError` | `string` | No | Last runtime error from the code executor, if any. Included in the AI context. |

### `NioChatMessage`

| Field | Type | Description |
|---|---|---|
| `role` | `"user" \| "assistant"` | Message author. |
| `content` | `string` | Message text. |

### `NioTranscriptPayload`

| Field | Type | Description |
|---|---|---|
| `startSec` | `number` | Start of the transcript window (seconds). |
| `endSec` | `number` | End of the transcript window (seconds). |
| `lines` | `string[]` | Transcript lines within the window. May be empty; the server attempts fallback resolution via Convex, SRT files, and YouTube captions. |

### `NioCodePayload`

| Field | Type | Required | Description |
|---|---|---|---|
| `language` | `string` | Yes | Programming language identifier (e.g. `"python"`, `"c"`, `"javascript"`). |
| `codeHash` | `string` | No | Hash of the current code, used for deduplication in Convex. |
| `code` | `string` | No | Current editor content. Included in the AI context when present. |
| `fileName` | `string` | No | Active file name, e.g. `"main.py"`. |

### `NioLessonMetaPayload`

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | No | Lesson title. |
| `lectureNumber` | `number` | No | Lecture number within the course. |
| `subtitlesUrl` | `string` | No | URL of an SRT subtitle file (used as transcript fallback). |
| `transcriptUrl` | `string` | No | URL of a plain-text transcript (used as transcript fallback). |

---

## Response

On success the server returns `HTTP 200` with `Content-Type: text/event-stream; charset=utf-8` and the following headers:

```
Cache-Control: no-cache, no-transform
Connection: keep-alive
X-Accel-Buffering: no
```

### SSE Format

Each event uses the standard SSE wire format:

```
event: <type>
data: <json>

```

The `data` value is a single JSON object. If the JSON contains newlines, each line is prefixed with `data: ` and the client joins them before parsing.

Events are delimited by a blank line (`\n\n`). The client splits on `\n\n` and parses each chunk independently.

### SSE Event Types

#### `meta` — Stream started

Sent once at the beginning of the stream before any tokens. Contains context metadata for diagnostics.

| Field | Type | Description |
|---|---|---|
| `type` | `"meta"` | Event discriminator. |
| `requestId` | `string` | Echoed from the request. |
| `assistantTempId` | `string` | Echoed from the request. |
| `provider` | `string` | AI provider name (e.g. `"gemini"`, `"groq"`). |
| `model` | `string` | Model identifier used for this request. |
| `startedAtMs` | `number` | Unix timestamp (ms) when streaming began. |
| `contextHash` | `string` | Hash of the assembled prompt context. |
| `budget.maxOutputTokens` | `number` | Maximum output tokens allowed. |
| `budget.maxContextTokens` | `number` | Maximum context tokens allowed. |
| `budget.approxCharBudget` | `number` | Approximate character budget for the context. |
| `seq` | `number` | Sequence number (always `0` for `meta`). |

#### `token` — Partial response chunk

Sent for each token or chunk of the assistant response as it streams.

| Field | Type | Description |
|---|---|---|
| `type` | `"token"` | Event discriminator. |
| `requestId` | `string` | Echoed from the request. |
| `assistantTempId` | `string` | Echoed from the request. |
| `seq` | `number` | Monotonically increasing sequence number starting at `1`. |
| `token` | `string` | The text chunk. Concatenating all tokens in order reconstructs the full response. |

#### `done` — Stream complete

Sent once when the AI provider signals completion. The client should use `finalText` as the canonical response.

| Field | Type | Description |
|---|---|---|
| `type` | `"done"` | Event discriminator. |
| `requestId` | `string` | Echoed from the request. |
| `assistantTempId` | `string` | Echoed from the request. |
| `seq` | `number` | Sequence number of the final event. |
| `provider` | `string` | Provider that served the response. |
| `model` | `string` | Model that served the response. |
| `usedFallback` | `boolean` | `true` if Groq fallback was used instead of Gemini primary. |
| `latencyMs` | `number` | Total time from request start to stream complete (ms). |
| `timeToFirstTokenMs` | `number` | Time from request start to first token (ms). |
| `usageApprox.inputChars` | `number` | Approximate input character count (proxy for input tokens). |
| `usageApprox.outputChars` | `number` | Approximate output character count (proxy for output tokens). |
| `finalText` | `string` | The complete assistant response. Use this rather than the concatenated tokens. |

#### `error` — Terminal error

Sent when the stream cannot proceed. No `done` event follows.

| Field | Type | Description |
|---|---|---|
| `type` | `"error"` | Event discriminator. |
| `requestId` | `string` | Echoed from the request. |
| `assistantTempId` | `string` | Echoed from the request. |
| `seq` | `number` | Current sequence number at time of error. |
| `code` | `NioErrorCode` | Machine-readable error code. See Error Codes below. |
| `message` | `string` | Human-readable description of the error. |
| `provider` | `string \| undefined` | Provider involved, if applicable. |

---

## Error Codes

### HTTP-level errors (non-SSE)

These are returned as JSON before the SSE stream is opened.

| HTTP Status | `error.code` | Description |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Request body is malformed or missing required fields. |
| `401` | `AUTH_REQUIRED` | No valid Clerk JWT in production. |
| `429` | `RATE_LIMITED` | Per-user rate limit exceeded (20 requests per 10 minutes). |
| `503` | `SERVICE_UNAVAILABLE` | Convex rate-limit check failed (transient). |

### SSE-level errors (`NioErrorCode`)

These arrive as `error` events inside the SSE stream.

| Code | Description |
|---|---|
| `NO_API_KEY` | No AI provider API key is configured. The client displays a "bring your own key" prompt. |
| `AUTH_REQUIRED` | Authentication required but not present (can also appear in stream context). |
| `RATE_LIMITED` | Per-user rate limit exceeded. |
| `VALIDATION_ERROR` | Request payload did not pass server-side validation. |
| `PROVIDER_429` | Upstream AI provider returned 429 (rate limited by provider). |
| `PROVIDER_5XX` | Upstream AI provider returned a 5xx error. |
| `TIMEOUT_FIRST_TOKEN` | No first token received within the timeout window. |
| `STREAM_ERROR` | Unexpected failure during streaming (catch-all). Also emitted if the 120-second stream body timeout is reached. |

---

## Example

### Request

```bash
curl -N -X POST https://niotebook.com/api/nio \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk-jwt>" \
  -d '{
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "assistantTempId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "lessonId": "jd7abc123",
    "threadId": "jd7thread456",
    "videoTimeSec": 312,
    "userMessage": "What does this function do?",
    "recentMessages": [],
    "transcript": {
      "startSec": 252,
      "endSec": 372,
      "lines": ["In this section we define the helper function..."]
    },
    "code": {
      "language": "python",
      "code": "def greet(name):\n    return f\"Hello, {name}\"",
      "fileName": "main.py"
    }
  }'
```

### Annotated SSE Response

```
event: meta
data: {"type":"meta","requestId":"550e8400-...","assistantTempId":"6ba7b810-...","provider":"gemini","model":"gemini-2.0-flash","startedAtMs":1741500000000,"contextHash":"a3f1...","budget":{"maxOutputTokens":1024,"maxContextTokens":8192,"approxCharBudget":32768},"seq":0}

event: token
data: {"type":"token","requestId":"550e8400-...","assistantTempId":"6ba7b810-...","seq":1,"token":"The "}

event: token
data: {"type":"token","requestId":"550e8400-...","assistantTempId":"6ba7b810-...","seq":2,"token":"greet "}

event: token
data: {"type":"token","requestId":"550e8400-...","assistantTempId":"6ba7b810-...","seq":3,"token":"function takes a name and returns a greeting string."}

event: done
data: {"type":"done","requestId":"550e8400-...","assistantTempId":"6ba7b810-...","seq":4,"provider":"gemini","model":"gemini-2.0-flash","usedFallback":false,"latencyMs":1240,"timeToFirstTokenMs":380,"usageApprox":{"inputChars":1820,"outputChars":52},"finalText":"The greet function takes a name and returns a greeting string."}

```

---

## Versioning Note

**Internal API, no versioning.** The client and server are co-deployed as a single Next.js application. There is no external contract to maintain. Breaking changes to `NioChatRequest` or the SSE event schema require updating `src/ui/chat/useChatThread.ts` alongside `src/app/api/nio/route.ts` in the same commit or PR.
