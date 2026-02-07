# Debugger Agent Memory

## Chat Streaming Pipeline
- SSE flow: `/api/nio/route.ts` (POST handler) -> Gemini/Groq provider streams -> SSE events -> client `useChatThread.ts` -> RAF-batched token flush -> `setLocalMessages` -> `mergedMessages` useMemo -> `AiPane` re-render -> `ChatScroll` + `ChatMessage` list
- Token buffering: `useChatThread.ts` lines 461-483 uses `requestAnimationFrame` to batch SSE tokens before flushing to state
- Typewriter effect: `ChatMessage.tsx` `StreamingContent` component (lines 48-90) uses separate `setTimeout(tick, 16)` loop to reveal characters 2 at a time
- Known jank causes: (1) ReactMarkdown + remark-gfm + rehype-highlight re-parsed every 16ms tick, (2) ChatMessage not memo'd causing full list re-renders, (3) ChatScroll auto-scroll depends on `children` ref (changes every render), (4) no `overflow-anchor` CSS

## Key Files - Chat
- `src/ui/chat/ChatMessage.tsx` - Message rendering, StreamingContent typewriter, AssistantContent/RenderedMarkdown (memo'd individually)
- `src/ui/chat/ChatScroll.tsx` - Scroll container with auto-scroll logic
- `src/ui/chat/useChatThread.ts` - Chat state hook, SSE consumption, token buffering
- `src/ui/chat/ChatComposer.tsx` - Input textarea
- `src/ui/panes/AiPane.tsx` - Parent component assembling chat UI
- `src/infra/ai/nioSse.ts` - SSE encode/parse utilities
- `src/app/api/nio/route.ts` - SSE streaming API endpoint (Gemini primary, Groq fallback)
- `src/app/globals.css` - `.nio-markdown` styles (line ~329)

## Architecture Notes
- State: `localMessages` (useState) + `remoteMessages` (Convex useQuery) + `cachedMessages` (IndexedDB) merged in `mergedMessages` useMemo
- Convex queries: `chat:getChatThread`, `chat:getChatMessages`, `chat:createChatMessage`, `chat:completeAssistantMessage`
- Providers: Gemini (`gemini-3-flash-preview`), Groq fallback, Stub (E2E preview)
- Packages: react-markdown ^10.1.0, remark-gfm ^4.0.1, rehype-highlight ^7.0.2
