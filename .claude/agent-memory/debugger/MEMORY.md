# Debugger Agent Memory

## Chat Visibility Bug Root Causes (2026-02-07)

### Critical Race Condition: State Before DOM
- **Bug**: `useChatThread.ts:304` sets `streamState → "streaming"` BEFORE messages exist in DOM
- **Impact**: ChatScroll's ResizeObserver disabled before user message renders → no scroll → message hidden
- **Lesson**: State transitions that control UI behavior must happen AFTER DOM updates that depend on them
- **Fix recommendation**: Scroll immediately on send, OR separate "waiting" from "streaming" states

### Over-Aggressive Feature Flag
- **Bug**: `ChatScroll.tsx:50` — `if (isStreaming) return;` kills ResizeObserver entirely during streaming
- **Intent**: Prevent auto-scroll during AI reveal so users can read from top
- **Consequence**: Users can't see their own messages (breaks core UX expectation)
- **Lesson**: Binary feature flags that disable core functionality need granular control, not all-or-nothing

### Layout Overflow Issue
- **Location**: `AiPane.tsx:162` — parent uses `flex-col gap-4 overflow-hidden`, ChatScroll has `flex-1`
- **Symptom**: Content grows inside scroll container but doesn't auto-scroll → messages hidden behind ChatComposer
- **Contributing factor**: ResizeObserver is the ONLY scroll trigger; when disabled, no fallback

## Chat Streaming Pipeline (Reference)
- SSE flow: `/api/nio/route.ts` → Gemini/Groq → SSE events → `useChatThread.ts` RAF-batched flush → `setLocalMessages` → `mergedMessages` useMemo → `AiPane` render → `ChatScroll` + `ChatMessage` list
- Token buffering: `useChatThread.ts:461-501` uses RAF to batch tokens every 16ms
- Typewriter reveal: `ChatMessage.tsx:67-103` RAF loop reveals 3 chars every 12ms AFTER full response received
- 3 message phases: `isStreaming` (thinking dot) → `isRevealing` (typewriter) → fully revealed (markdown parsed once)
- 200-char threshold: streaming switches to revealing when buffer hits 200 chars

## Key Files - Chat
- `src/ui/chat/ChatScroll.tsx` - Scroll container, ResizeObserver auto-scroll (line 49: THE BUG)
- `src/ui/chat/useChatThread.ts` - Chat state, SSE streaming, token buffering (line 304: THE BUG)
- `src/ui/panes/AiPane.tsx` - Layout structure (line 162-182: overflow + flex constraints)
- `src/ui/chat/ChatMessage.tsx` - 3-phase rendering, memo'd AssistantContent/RenderedMarkdown
- `src/ui/chat/ChatComposer.tsx` - Input textarea (not involved in bug)
- `src/infra/ai/nioSse.ts` - SSE encode/parse utilities
- `src/app/api/nio/route.ts` - SSE streaming endpoint (Gemini primary, Groq fallback)

## Debugging Methodology That Worked
1. Read ALL implicated files completely (no skimming)
2. Trace execution flow from user action to symptom (click send → no scroll)
3. Identify state transitions and their exact timing
4. Map component hierarchy and prop data flow
5. Analyze layout constraints (flex, overflow, height)
6. Form 2-3 specific hypotheses BEFORE investigating
7. Gather evidence to confirm/refute each hypothesis
8. Document findings with exact line numbers + code snippets

## Performance Optimizations Observed (Not Bugs)
- `ChatMessage.tsx:163-166` — `contentVisibility: auto` for off-screen messages ✓
- `ChatScroll.tsx:97` — `overflowAnchor: none` (intentional, prevents native scroll anchoring) ✓
- RAF batching in token flush + typewriter reveal ✓
- Memo on `RenderedMarkdown` and `AssistantContent` ✓

## General Patterns

### Timing & Order in React
- State updates → microtask queue
- DOM updates → next paint
- Effects run after render, before paint
- ResizeObserver fires after layout, before paint
- Race conditions when state affects observers that depend on DOM being ready

### Layout Debugging Checklist
1. Parent height constraints? (flex-1, min-h-0, overflow-hidden)
2. Which element has overflow-y-auto?
3. Scroll calculation correct? (scrollHeight - scrollTop - clientHeight)
4. CSS interference? (overflow-anchor, content-visibility, scroll-behavior)

### SSE Stream Debugging
- Buffer management: when do tokens flush to state?
- RAF vs immediate setState for batching
- Error boundaries: stream drop mid-response?
- Cleanup: RAF handles cancelled on unmount?

## Convex Patterns
- useQuery with conditional "skip" based on env flags
- useMutation returns promises for imperative use
- makeFunctionReference for type-safe dynamic refs
- State: remoteMessages (Convex) + cachedMessages (IndexedDB) + localMessages (useState)
