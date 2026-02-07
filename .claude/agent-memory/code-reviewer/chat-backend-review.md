# Chat Backend Review (2026-02-07)

## Files Reviewed
- `src/app/api/nio/route.ts` -- main POST handler (1170 lines)
- `src/infra/ai/geminiStream.ts` -- Gemini streaming provider
- `src/infra/ai/groqStream.ts` -- Groq streaming provider
- `src/infra/ai/promptInjection.ts` -- prompt injection neutralization
- `src/infra/ai/nioSse.ts` -- SSE encode/decode
- `src/infra/ai/validateNioChatRequest.ts` -- request validation
- `src/infra/ai/providerTypes.ts` -- provider error types
- `src/infra/ai/fallbackGate.ts` -- fallback decision logic
- `src/infra/ai/subtitleFallback.ts` -- SRT subtitle fetch + cache
- `src/infra/ai/youtubeTranscriptFallback.ts` -- YouTube transcript fetch + cache
- `src/domain/nioContextBuilder.ts` -- context assembly + truncation
- `src/domain/nioPrompt.ts` -- system prompt
- `src/domain/ai/types.ts` -- SSE event types
- `src/domain/ai-fallback.ts` -- fallback constants
- `src/domain/rate-limits.ts` -- rate limit domain logic
- `convex/chat.ts` -- chat persistence mutations
- `convex/rateLimits.ts` -- rate limit mutations
- `convex/auth.ts` -- Convex auth layer

## Architecture Summary
- POST `/api/nio` -> validate -> auth -> rate limit -> sanitize -> build context -> stream
- Gemini primary (10s first-token timeout) -> Groq fallback
- SSE protocol: meta -> token* -> done/error
- Fire-and-forget persistence to Convex after stream completes
- Context builder truncates: drop history -> truncate transcript -> truncate code -> fail

## Critical Findings
1. Regex /g statefulness on module-level patterns in promptInjection.ts
2. Gemini API key in debug logs via URL in geminiStream.ts:103-104
3. Provider iterators/HTTP connections never cancelled on fallback or abort

## Warning Findings
1. No input size limits in validateNioChatRequest.ts
2. SSRF via subtitlesUrl in subtitleFallback.ts
3. Unbounded in-memory caches (subtitleCache, ytCache)
4. Auth+rate-limit silently bypassed in non-production
5. Fire-and-forget persistence with no retry
6. No GET/OPTIONS handlers (minor, CORS concern for future)
7. Gemini 60s timeout doesn't propagate to stream reader

## Good Patterns Observed
- Typed SSE event protocol with seq numbers
- Idempotent completeAssistantMessage (checks requestId)
- Defensive enqueue/close guards on ReadableStream
- Three-layer transcript fallback with Promise.allSettled
- Context budget truncation strategy is deterministic
- Thread ownership verification in Convex mutations
