# Backend Engineer Agent Memory

## SSE Streaming Pipeline Architecture
- See `sse-streaming-analysis.md` for detailed investigation (Feb 2026)

## Key File Locations
- **API Route**: `src/app/api/nio/route.ts` — POST handler, ReadableStream-based SSE
- **SSE Headers/Encoding**: `src/infra/ai/nioSse.ts` — `NIO_SSE_HEADERS`, `encodeSseEvent`, `parseSseEvent`
- **Gemini Provider**: `src/infra/ai/geminiStream.ts` — async generator, line-based SSE parsing
- **Groq Provider**: `src/infra/ai/groqStream.ts` — async generator, chunk-based SSE parsing
- **Provider Types**: `src/infra/ai/providerTypes.ts` — `NioProviderStreamResult`, error classes
- **Fallback Logic**: `src/infra/ai/fallbackGate.ts` + `src/domain/ai-fallback.ts` (10s timeout)
- **Client Consumer**: `src/ui/chat/useChatThread.ts` — RAF-batched flush, 200-char reveal threshold
- **Rendering**: `src/ui/chat/ChatMessage.tsx` — thinking dot, RevealContent typewriter, RenderedMarkdown
- **Domain Types**: `src/domain/ai/types.ts` — NioSseEvent union, NioChatRequest

## Auth Flow
- Clerk JWT -> `Authorization: Bearer <token>` -> ConvexHttpClient with fetchWithAuth wrapper
- Auth bypass in dev mode via `NIOTEBOOK_DEV_AUTH_BYPASS` env var
- Rate limiting via `api.rateLimits.consumeAiRateLimit` Convex mutation

## AI Provider Fallback
- Primary: Gemini (`gemini-3-flash-preview`), Fallback: Groq (`llama-3.3-70b-versatile`)
- 10s timeout for first token, then fallback to Groq
- Fallback events logged to Convex `events` table

## Convex Patterns
- `ConvexHttpClient` used from API routes (not React hooks)
- Fire-and-forget persistence: `void persistAssistantMessage(...).catch()`
- `api.chat.completeAssistantMessage` persists completed assistant messages

## Next.js Config
- No explicit `runtime` export on `/api/nio/route.ts` — defaults to Node.js runtime
- Sentry wrapping via `withSentryConfig` in `next.config.ts`
- COOP/COEP headers only on `/editor-sandbox` route

## Niotepad Data Layer (Feb 2026)
- **Domain types**: `src/domain/niotepad.ts` — NiotepadEntrySource, NiotepadEntryMetadata, NiotepadEntryData, NiotepadPage, NiotepadSnapshot, AddEntryParams
- **IndexedDB**: `src/infra/niotepad/indexedDbNiotepad.ts` — DB: "niotebook-niotepad", store: "notebooks", key: "notebook-v1". Follows VFS pattern (singleton dbPromise, JSON serialize, try/catch with console.warn).
- **Zustand store**: `src/infra/niotepad/useNiotepadStore.ts` — single store for panel state + data + actions. Module-level debounce timer for 500ms auto-save. Uses `storageAdapter` for localStorage.
- **Selectors**: `src/infra/niotepad/niotepadSelectors.ts` — selectFilteredEntries, selectTotalEntryCount, selectActivePageEntryCount
- **Key patterns**: `type` keyword (not `interface`), `crypto.randomUUID()` for IDs, `storageAdapter` for localStorage
- **localStorage keys**: `niotebook.niotepad.geometry` (JSON), `niotebook.niotepad.unread` ("true" or absent)
