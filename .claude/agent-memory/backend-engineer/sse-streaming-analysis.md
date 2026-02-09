# SSE Streaming Pipeline Analysis — Feb 2026

## Investigation: Chunky token delivery, flickering, auto-scroll bugs

### Architecture Summary

```
Gemini/Groq API  -->  async generator (token-by-token)
                        |
                  route.ts ReadableStream (enqueue per token)
                        |
                  Next.js Node.js runtime (NO explicit edge)
                        |
                  HTTP Response (text/event-stream, X-Accel-Buffering: no)
                        |
                  Browser fetch() + ReadableStream reader
                        |
                  useChatThread.ts (RAF-batched flush, 200-char threshold)
                        |
                  ChatMessage.tsx (thinking dot -> RevealContent typewriter -> RenderedMarkdown)
```

### Findings

#### ISSUE 1: No explicit `runtime = "edge"` export — Node.js buffering risk

**File**: `src/app/api/nio/route.ts`
**Severity**: HIGH (likely the primary cause of bursty delivery)

The route handler has no `export const runtime = "edge"` declaration. It defaults
to the Node.js runtime. In Node.js runtime, Next.js may apply response buffering
even when streaming ReadableStream responses. The Node.js HTTP layer can buffer
chunks before flushing to the network, causing tokens to arrive in bursts rather
than individually.

The `X-Accel-Buffering: no` header (line 7 of nioSse.ts) only disables Nginx
proxy buffering — it does NOT affect the Node.js runtime's internal buffering.

#### ISSUE 2: Gemini SSE parser yields per-line, not per-event

**File**: `src/infra/ai/geminiStream.ts`, lines 175-208
**Severity**: MEDIUM

The Gemini parser splits on `\n` (single newline) and processes each line
individually. SSE events from the Gemini API are delimited by `\n\n` (double
newline), but the parser iterates over single-line splits. This means if a single
`reader.read()` call returns multiple complete SSE events at once (which happens
when the network delivers data in larger chunks), they will all be yielded in
rapid succession within the same microtask — the route handler's while-loop
(lines 640-663 of route.ts) will enqueue them all before yielding back to the
event loop, and they may all be coalesced into one TCP write.

Contrast with the Groq parser (groqStream.ts lines 126-127) which correctly
splits on `\n\n` first, then processes lines within each event.

#### ISSUE 3: No per-token flushing signal in the ReadableStream

**File**: `src/app/api/nio/route.ts`, lines 1074-1163
**Severity**: MEDIUM-HIGH

The ReadableStream uses `controller.enqueue()` for each token event. However,
there is no mechanism to force an immediate network flush after each enqueue.
Web Streams in Node.js buffer internally. Multiple rapid `controller.enqueue()`
calls (which happen when the upstream provider yields multiple tokens quickly)
will be coalesced into a single network write. This is the core mechanism
causing bursty delivery on the server side.

The `enqueue()` function (lines 1081-1091) correctly encodes each event as a
separate SSE frame with `\n\n` termination, but the underlying transport batches
them.

#### ISSUE 4: RAF-batched flush coalesces tokens on the client

**File**: `src/ui/chat/useChatThread.ts`, lines 466-501
**Severity**: MEDIUM

The client-side `scheduleFlush()` (lines 492-501) uses `requestAnimationFrame`
to batch token updates. This means:

1. Multiple tokens arriving between animation frames (16.6ms at 60fps) are
   concatenated into `tokenBuffer` (line 521)
2. They are all flushed as a single `updateLocalMessage` call in the next RAF
3. This is intentional for performance (avoiding per-token React re-renders),
   but it amplifies any server-side burstiness

If the server sends 10 tokens in a 50ms burst (due to Issue 1/3), the client
receives them across ~3 RAF frames, but they may all land in 1-2 flushes.

#### ~~ISSUE 5: The 200-char reveal transition causes a visual jump~~ (RESOLVED — system removed)

> The entire RevealContent/typewriter system was removed in the chat overhaul.
> `wasStreaming`, `isRevealing`, and the 200-char threshold no longer exist.
> Current rendering: `isStreaming` true → plain `<span>` text; false → `<ReactMarkdown>`.

#### ~~ISSUE 6: RevealContent renders content as plain text, then switches to markdown~~ (RESOLVED — system removed)

> Same as above — RevealContent no longer exists. The plain-text-to-markdown
> transition still happens but without the typewriter animation layer.

#### ISSUE 7: Token events carry variable-size payloads

**File**: `src/infra/ai/geminiStream.ts`, lines 200-207
**Severity**: LOW

Gemini's streaming API can yield tokens of highly variable length — sometimes
single characters, sometimes entire sentences or code blocks. This is an
inherent property of the LLM API, not a bug in the code. However, it means
the "smoothness" of the stream is fundamentally dependent on the provider's
chunking behavior. There is no server-side normalization (e.g., splitting large
tokens into fixed-size pieces).

### Non-Issues (Things That Are Correct)

1. **SSE Headers** (`src/infra/ai/nioSse.ts`, lines 3-8): Correctly set
   `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`,
   `Connection: keep-alive`, and `X-Accel-Buffering: no`.

2. **SSE Event Format** (`encodeSseEvent`, lines 10-15): Correctly formats
   events with `event:` type, `data:` prefix per line, and `\n\n` termination.

3. **SSE Parser** (`parseSseEvent`, lines 203-244): Correctly splits on
   newlines, extracts event type and data lines, JSON-parses, and validates
   with type-specific parsers.

4. **Abort handling**: Both the ReadableStream (line 1107) and the streaming
   loop (line 646) properly check for abort signals.

5. **Fire-and-forget persistence** (line 696): Correctly does not block the
   stream close on database writes.

### Recommendations (Not Implemented)

1. **Add `export const runtime = "edge"` to route.ts** to use the Edge Runtime,
   which has better streaming characteristics and avoids Node.js buffering.
   Alternatively, explore Next.js `unstable_allowDynamic` or ensure the
   response is not buffered by the Node.js adapter.

2. **Consider smaller token batching or forced flushing** — if staying on
   Node.js runtime, investigate whether `controller.enqueue()` can be paired
   with a flush mechanism, or switch to a `TransformStream` approach.

3. ~~**Fix the 200-char transition**~~ — RESOLVED: typewriter/RevealContent system was removed entirely.

4. **Normalize token sizes on the server** — split large tokens (>50 chars)
   into smaller chunks before enqueuing to the SSE stream, providing more
   consistent delivery cadence.

5. **Consider streaming markdown rendering** — instead of plain text during
   streaming then snapping to markdown on done, use an incremental markdown
   parser that renders partial markdown as it arrives.
