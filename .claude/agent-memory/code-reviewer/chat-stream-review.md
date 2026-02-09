# Chat Stream Architecture Review (updated 2026-02-07, post-overhaul)

Previous review covered the typewriter/RevealContent system. That has been entirely removed.
The current architecture (commit 72a08f1) is simpler: plain text during streaming, markdown after done.

## Current Architecture

### Client pipeline

1. `AiPane.tsx` -- wires `useChatThread` + `ChatScroll` + `ChatComposer`
2. `useChatThread.ts` -- core hook: manages messages, streaming fetch, RAF token batching
3. `ChatMessage.tsx` -- memo'd component: plain `<span>` during streaming, `<ReactMarkdown>` after
4. `ChatScroll.tsx` -- ResizeObserver auto-scroll + "scroll to bottom" button
5. `ChatComposer.tsx` -- textarea + send button, disabled during streaming

### Server pipeline

1. `route.ts` (POST /api/nio) -- validates, rate-limits, builds context, streams SSE
2. `geminiStream.ts` / `groqStream.ts` -- async generator wrappers for AI providers
3. `nioSse.ts` -- encode/decode SSE events (meta, token, done, error)
4. `fallbackGate.ts` -- decides when to fall back from Gemini to Groq

### Key patterns

- **Token batching**: `tokenBuffer` + RAF-scheduled `flushTokens()` in useChatThread
- **Three-layer dedup**: remote (Convex) > cached (localStorage) > local (React state)
- **Provider fallback**: Gemini first, read first token with timeout, fall to Groq if needed
- **State machine**: `streamState` is "idle" | "streaming" (the "error" variant is dead code)
- **Error display**: separate `streamError` string state shown as warning banner
- **Content rendering**: `isStreaming` true -> plain text; false -> ReactMarkdown
- **Auto-scroll**: ResizeObserver on content wrapper, atBottom ref guard
- **`wasStreaming`**: set on done event but NEVER READ -- dead data from old typewriter system
- **Stuck stream guard**: 30s timeout allows force-sending a new message

## Known issues (2026-02-07 review)

### Critical

- **No AbortController on client fetch** -- streams not cancellable, leak on lesson change/unmount
- **Gemini API key logged in debug output** (requestUrl includes `?key=`)
- **Regex /g flag on module-level patterns** in promptInjection.ts causes `.test()` lastIndex bugs

### Warnings

- `ChatStreamState` "error" variant is defined but never set
- `mergedMessages` creates new object refs for ALL messages on every recompute (defeats memo)
- Server-side iterators never explicitly cancelled on abort (TCP connection leak)
- Gemini generator has no mid-stream timeout (stall after first token hangs indefinitely)
- Concurrent streams possible after 30s stuck guard (shared rafRef contention)
- localStorage cache effect runs on every RAF frame during streaming (unnecessary JSON.stringify)
- SSE parser .trim() on data lines is latent bug for multi-line JSON
- `wasStreaming` field set but never consumed (dead code from old typewriter)
