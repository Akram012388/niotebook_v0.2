# Chat Stream Rendering Review -- 2026-02-07

## Files reviewed
- `src/ui/chat/ChatMessage.tsx` -- RevealContent, AssistantContent, ChatMessage (memo'd)
- `src/ui/chat/ChatScroll.tsx` -- ResizeObserver scroll, disabled during streaming
- `src/ui/chat/useChatThread.ts` -- SSE stream processing, buffer threshold, state transitions
- `src/ui/panes/AiPane.tsx` -- isStreaming prop includes isRevealing check
- `src/ui/chat/chatTypes.ts` -- isRevealing, wasStreaming fields added

## State machine trace (normal path, >=200 chars)
1. User sends -> placeholder created: `isStreaming: true`
2. Tokens arrive, RAF flushes content (thinking dot shown, content buffered but hidden)
3. At 200 chars: `isStreaming: false, isRevealing: true, wasStreaming: true`
4. AssistantContent mounts with `wasStreaming: true` -> `revealed = false` -> RevealContent renders
5. More tokens arrive during reveal (stream still open), contentLenRef.current grows
6. `done` event: `isStreaming: false, isRevealing: false, wasStreaming: true, content: finalText`
7. RevealContent cursor catches up to finalText.length -> `onRevealDone` fires -> `revealed: true`
8. RenderedMarkdown renders final content

## Bug: contentVisibility applied during active reveal (step 6-7)
When `done` sets `isRevealing: false`, `isActive` becomes false, and CSS `contentVisibility: "auto"`
is applied. The typewriter animation is still running internally in AssistantContent/RevealContent.
If message is near viewport edge, browser may skip rendering it.

## Edge case: short response (<200 chars)
- Thinking dot shown entire time (content buffered but isStreaming:true hides it)
- `done` event transitions directly to wasStreaming:true
- Typewriter runs over full short content (completes in ~300ms)
- UX gap: no incremental feedback for slow-but-short responses

## Edge case: empty response (0 tokens)
- `done` with empty `finalText` -> RevealContent mounts with `contentLenRef.current = 0`
- Early guard fires onRevealDone immediately -> switches to RenderedMarkdown with empty string
- Works correctly

## Edge case: error during stream
- Error events set `isStreaming: false, isRevealing: false` but NOT `wasStreaming: true`
- Error message renders as immediate markdown, no typewriter. Intentional.

## React.memo effectiveness
- ChatMessage is memo'd but `mergedMessages` creates new objects for ALL messages on each recompute
- `toChatMessage()` and `fromCachedMessage()` create new objects unconditionally
- Only the streaming message content changes, but all messages get new references
- Memo'd ChatMessage still re-renders for all messages during streaming
- Fix: compare prev/next per-message and reuse old reference when unchanged
