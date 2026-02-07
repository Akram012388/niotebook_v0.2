# Chat Rendering Performance Analysis (2026-02-07)

## The Flicker Root Cause

The primary flickering is caused by `RevealContent` in `src/ui/chat/ChatMessage.tsx:58-92`.

### The Bug Mechanism

```
1. SSE tokens arrive at ~60Hz via useChatThread RAF flush
2. Each flush calls updateLocalMessage -> content grows
3. content.length (targetLen) changes -> useEffect dependency fires
4. Effect cleanup cancels the running RAF tick loop
5. Effect re-runs with `let current = 0` (LINE 66) -- LOCAL VARIABLE RESETS
6. First tick sets setVisible(0) -> content DISAPPEARS
7. Subsequent ticks rebuild visible from 0 at 3 chars/12ms
8. Before catching up, step 1 happens again -> reset to 0 again
9. User sees: content appears briefly, disappears, appears, disappears = FLICKER
```

### Fix Strategy

Make `current` a `useRef` that persists across effect restarts. Better yet, remove `targetLen` from the dependency array entirely and read `content.length` from a ref inside the tick closure.

### Stream Phase Lifecycle

```
Stream start -> message.isStreaming=true, isRevealing=false -> thinking dot shown
  |
  v  (after REVEAL_THRESHOLD=200 chars buffered)
Reveal transition -> isStreaming=false, isRevealing=true, wasStreaming=true
  |                  AssistantContent mounts with wasStreaming=true
  |                  RevealContent mounts (revealed=false)
  |                  SSE stream CONTINUES filling content in background
  |
  v  (SSE stream completes with "done" event)
Stream done -> isRevealing=false, wasStreaming=true, content=finalText
  |            RevealContent continues animating to full length
  |
  v  (RevealContent finishes: current >= targetLen)
Fully revealed -> handleRevealDone -> revealed=true
  |               RenderedMarkdown replaces RevealContent
  |               Full markdown parsing happens ONCE
```

### Re-render Chain During Streaming

```
updateLocalMessage (useChatThread.ts:483)
  -> setLocalMessages (state update)
    -> mergedMessages useMemo recomputes (dep: localMessages)
      -> AiPane re-renders
        -> messages.map() creates new JSX for ALL ChatMessage components
          -> ChatMessage (NOT memo'd) re-renders for ALL messages
            -> AssistantContent (memo'd) re-renders only for active message
              -> RevealContent re-renders (content prop changed -> targetLen changed)
                -> useEffect restarts -> FLICKER
```

### Files Involved

- `src/ui/chat/ChatMessage.tsx` - RevealContent, AssistantContent, ChatMessage
- `src/ui/chat/ChatScroll.tsx` - ResizeObserver, scroll management
- `src/ui/chat/useChatThread.ts` - SSE processing, RAF flush, state management
- `src/ui/panes/AiPane.tsx` - Container, message list rendering
- `src/ui/chat/chatTypes.ts` - Message type with isStreaming/isRevealing/wasStreaming flags
