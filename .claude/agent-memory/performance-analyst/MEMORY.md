# Performance Analyst Memory

## Chat Streaming Rendering (2026-02-07)
See: [chat-rendering-analysis.md](./chat-rendering-analysis.md)

### Key Findings
- **CRITICAL BUG**: `RevealContent` in `ChatMessage.tsx:58-92` resets `current` to 0 on every `targetLen` change because `current` is a local variable inside the useEffect, not a useRef. During streaming, content grows -> targetLen changes -> effect restarts -> animation resets to empty -> flicker.
- **Double RAF**: `useChatThread.ts:497` (token flush) and `ChatMessage.tsx:85` (typewriter tick) run concurrently. The flush triggers targetLen change which restarts the tick loop.
- **Missing memo**: `ChatMessage` component in `AiPane.tsx:159-161` is not memo'd, causing all messages to re-render at ~60Hz during streaming.
- **ResizeObserver active during reveal**: `ChatScroll.tsx` disables observer only when `streamState === "streaming"`, but reveal phase runs with `streamState === "idle"`.

### Architecture Notes
- SSE tokens arrive -> RAF-batched flush in useChatThread -> updateLocalMessage -> mergedMessages recomputes -> AiPane re-renders -> ChatMessage re-renders
- Two-phase rendering: Phase 1 (thinking dot while `isStreaming && !isRevealing`), Phase 2 (typewriter reveal after REVEAL_THRESHOLD=200 chars)
- `wasStreaming` flag triggers RevealContent mount; without it, RenderedMarkdown renders immediately (for historical messages)
- `contentVisibility: "auto"` used on inactive messages for render optimization (ChatMessage.tsx:151)

### No Benchmarks Exist
- No performance tests in the test suite for chat rendering
- Need to add React.Profiler instrumentation for hard numbers
- Chrome DevTools Performance tab recommended for frame timing analysis
