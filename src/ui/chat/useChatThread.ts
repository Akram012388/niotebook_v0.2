"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { useAuthToken } from "@/infra/auth/authTokenContext";
import { useMutation, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { api } from "../../../convex/_generated/api";
import type { ChatMessageSummary, ChatThreadSummary } from "../../domain/chat";
import { orderChatMessages } from "../../domain/chat";
import type { NioChatRequest } from "../../domain/nio";
import { parseSseEvent } from "../../infra/ai/nioSse";
import { formatTimestamp } from "../formatTimestamp";
import type { ChatMessage, ChatStreamState } from "./chatTypes";
import type { EventLogResult } from "../../domain/events";
import {
  readChatCache,
  writeChatCache,
} from "../../infra/cache/chatLocalCache";
import {
  createChatMessageRef,
  ensureChatThreadRef,
  getChatMessagesRef,
  getChatThreadRef,
} from "./convexChat";

const STUCK_STREAM_TIMEOUT_MS = 30_000;

/** Callback invoked for each token during streaming (bypasses React state). */
type OnStreamToken = (token: string) => void;

type ChatSendContext = {
  videoTimeSec: number;
  transcript: {
    startSec: number;
    endSec: number;
    lines: string[];
  };
  code: {
    language: string;
    codeHash?: string;
    code?: string;
    fileName?: string;
  };
  lesson?: {
    title?: string;
    lectureNumber?: number;
    subtitlesUrl?: string;
    transcriptUrl?: string;
  };
  lastError?: string;
};

type UseChatThreadResult = {
  thread: ChatThreadSummary | null;
  messages: ChatMessage[];
  threadId: string | null;
  streamState: ChatStreamState;
  streamError: string | null;
  noApiKey: boolean;
  sendMessage: (content: string, context: ChatSendContext) => Promise<void>;
  /** Mutable ref — set this to a callback to receive tokens without React state. */
  onStreamTokenRef: MutableRefObject<OnStreamToken | null>;
};

const PAGE_LIMIT = 20;

const toChatMessage = (
  message: ChatMessageSummary,
  lectureLabel: string,
): ChatMessage => {
  return {
    id: message.id as unknown as string,
    role: message.role,
    content: message.content,
    badge: `${lectureLabel} • ${formatTimestamp(message.videoTimeSec)}`,
    timestampSec: message.videoTimeSec,
    requestId: message.requestId,
    createdAt: message.createdAt,
  };
};

const toCachedMessage = (
  message: ChatMessage,
): {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestampSec: number;
  createdAt: number;
  requestId?: string;
} => {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestampSec: message.timestampSec,
    createdAt: message.createdAt,
    requestId: message.requestId,
  };
};

const fromCachedMessage = (
  message: {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestampSec: number;
    createdAt: number;
    requestId?: string;
  },
  lectureLabel: string,
): ChatMessage => {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    badge: `${lectureLabel} • ${formatTimestamp(message.timestampSec)}`,
    timestampSec: message.timestampSec,
    createdAt: message.createdAt,
    requestId: message.requestId,
  };
};

const buildRecentMessages = (
  messages: ChatMessage[],
): NioChatRequest["recentMessages"] => {
  return messages
    .slice(-PAGE_LIMIT)
    .map((message) => ({ role: message.role, content: message.content }));
};

const useChatThread = (
  lessonId: string,
  lectureLabel: string,
): UseChatThreadResult => {
  const getToken = useAuthToken();
  const isConvexEnabled = process.env.NEXT_PUBLIC_DISABLE_CONVEX !== "true";
  const [streamState, setStreamState] = useState<ChatStreamState>("idle");
  const [streamError, setStreamError] = useState<string | null>(null);
  const [noApiKey, setNoApiKey] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);

  // Reactively clear noApiKey when the user adds an API key without refreshing.
  // listHints returns an entry for every stored key, so any non-empty result
  // means the user now has at least one key configured.
  const apiKeyHints = useQuery(
    api.userApiKeys.listHints,
    isConvexEnabled ? undefined : "skip",
  );
  const hasApiKey = (apiKeyHints?.length ?? 0) > 0;
  useEffect(() => {
    if (noApiKey && hasApiKey) {
      setNoApiKey(false);
      setStreamError(null);
    }
  }, [noApiKey, hasApiKey]);

  const thread = useQuery(
    getChatThreadRef,
    isConvexEnabled ? { lessonId } : "skip",
  );
  const ensureThread = useMutation(ensureChatThreadRef);

  const [localThreadId, setLocalThreadId] = useState<string | null>(null);

  // Reset local state when the lesson changes
  useEffect(() => {
    setLocalMessages([]);
    setLocalThreadId(null);
    setStreamState("idle");
    setStreamError(null);
  }, [lessonId]);

  const activeThreadId = (thread?.id as string | undefined) ?? localThreadId;

  const messagesPage = useQuery(
    getChatMessagesRef,
    activeThreadId && isConvexEnabled
      ? { threadId: activeThreadId, limit: PAGE_LIMIT }
      : "skip",
  );

  const createMessage = useMutation(createChatMessageRef);
  const logEventRef = useMemo(
    () =>
      makeFunctionReference<"mutation">(
        "events:logEvent",
      ) as import("convex/server").FunctionReference<
        "mutation",
        "public",
        {
          eventType: "nio_message_sent";
          lessonId?: string;
          sessionId?: string;
          metadata: {
            lessonId?: string;
            threadId?: string;
          };
        },
        EventLogResult
      >,
    [],
  );
  const logEvent = useMutation(logEventRef);

  const remoteMessages = useMemo(() => {
    return orderChatMessages(messagesPage?.messages ?? []);
  }, [messagesPage]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const cachedMessages = useMemo(() => {
    if (!isMounted) return [];
    const cached = readChatCache(lessonId);
    return cached.map((message) => fromCachedMessage(message, lectureLabel));
  }, [isMounted, lectureLabel, lessonId]);

  const mergedMessages = useMemo(() => {
    // Single-pass dedup using Maps keyed by id and requestId
    const seenIds = new Map<string, ChatMessage>();
    const seenRequestIds = new Set<string>();

    // Remote messages take priority
    for (const message of remoteMessages) {
      const chat = toChatMessage(message, lectureLabel);
      seenIds.set(chat.id, chat);
      if (chat.requestId) seenRequestIds.add(chat.requestId);
    }

    // Cached messages fill gaps
    for (const message of cachedMessages) {
      if (seenIds.has(message.id)) continue;
      if (message.requestId && seenRequestIds.has(message.requestId)) continue;
      seenIds.set(message.id, message);
      if (message.requestId) seenRequestIds.add(message.requestId);
    }

    // Local messages fill remaining gaps (with badge update)
    for (const message of localMessages) {
      if (seenIds.has(message.id)) continue;
      if (message.requestId && seenRequestIds.has(message.requestId)) continue;
      seenIds.set(message.id, {
        ...message,
        badge: `${lectureLabel} • ${formatTimestamp(message.timestampSec)}`,
      });
    }

    return Array.from(seenIds.values()).sort(
      (left, right) => left.createdAt - right.createdAt,
    );
  }, [cachedMessages, lectureLabel, localMessages, remoteMessages]);

  const cacheTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // Debounce localStorage writes to avoid thrashing during streaming.
    // Only cache non-streaming messages (completed content).
    if (cacheTimerRef.current !== null) {
      clearTimeout(cacheTimerRef.current);
    }
    cacheTimerRef.current = setTimeout(() => {
      cacheTimerRef.current = null;
      const cacheCandidates = mergedMessages.filter(
        (message) => !message.isStreaming && message.content.trim().length > 0,
      );
      if (cacheCandidates.length === 0) {
        return;
      }
      writeChatCache(
        lessonId,
        cacheCandidates.map((message) => toCachedMessage(message)),
      );
    }, 500);
    return () => {
      if (cacheTimerRef.current !== null) {
        clearTimeout(cacheTimerRef.current);
      }
    };
  }, [lessonId, mergedMessages]);

  const streamStartedAtRef = useRef<number>(0);
  const mergedMessagesRef: MutableRefObject<ChatMessage[]> =
    useRef(mergedMessages);
  mergedMessagesRef.current = mergedMessages;
  const streamStateRef: MutableRefObject<ChatStreamState> = useRef(streamState);
  streamStateRef.current = streamState;

  /** Mutable callback ref — AiPane wires this to StreamingText.append(). */
  const onStreamTokenRef = useRef<OnStreamToken | null>(null);

  const updateLocalMessage = useCallback(
    (id: string, updater: (message: ChatMessage) => ChatMessage): void => {
      setLocalMessages((prev) =>
        prev.map((message) => (message.id === id ? updater(message) : message)),
      );
    },
    [],
  );

  const sendMessage = useCallback(
    async (content: string, context: ChatSendContext): Promise<void> => {
      if (streamStateRef.current === "streaming") {
        const stuckMs = Date.now() - streamStartedAtRef.current;
        if (stuckMs < STUCK_STREAM_TIMEOUT_MS) {
          return;
        }
        // Force-reset stuck stream state
        setStreamState("idle");
      }

      // Finalize any still-streaming local messages
      setLocalMessages((prev) =>
        prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)),
      );

      setStreamError(null);
      setNoApiKey(false);
      setStreamState("streaming");
      streamStartedAtRef.current = Date.now();

      const requestId = crypto.randomUUID();
      const assistantTempId = crypto.randomUUID();
      const fallbackThreadId = activeThreadId ?? "local-thread";
      const recentMessages = buildRecentMessages(mergedMessagesRef.current);

      try {
        let resolvedThreadId = fallbackThreadId;

        if (isConvexEnabled) {
          try {
            resolvedThreadId = (activeThreadId ??
              (await ensureThread({ lessonId }))) as string;

            if (!activeThreadId) {
              setLocalThreadId(resolvedThreadId);
            }

            const timeWindow = {
              startSec: Math.max(0, context.videoTimeSec - 60),
              endSec: context.videoTimeSec + 60,
            };

            // Run createMessage and logEvent in parallel
            await Promise.all([
              createMessage({
                threadId: resolvedThreadId,
                role: "user",
                content,
                videoTimeSec: context.videoTimeSec,
                timeWindow,
                codeHash: context.code.codeHash,
              }),
              logEvent({
                eventType: "nio_message_sent",
                lessonId,
                metadata: {
                  lessonId,
                  threadId: resolvedThreadId,
                },
              }).catch((err: unknown) => {
                console.error("[chat] logEvent failed:", err);
              }),
            ]);
          } catch (err) {
            console.error("[chat] Convex calls failed:", err);
            // continue with local-only thread
            if (!activeThreadId) {
              setLocalThreadId(fallbackThreadId);
            }
            resolvedThreadId = fallbackThreadId;
          }
        } else if (!activeThreadId) {
          setLocalThreadId(fallbackThreadId);
        }

        const placeholder: ChatMessage = {
          id: assistantTempId,
          role: "assistant",
          content: "",
          badge: `${lectureLabel} • ${formatTimestamp(context.videoTimeSec)}`,
          timestampSec: context.videoTimeSec,
          createdAt: Date.now(),
          isStreaming: true,
          requestId,
        };

        setLocalMessages((prev) => [...prev, placeholder]);

        const payload: NioChatRequest = {
          requestId,
          assistantTempId,
          lessonId,
          threadId: resolvedThreadId,
          videoTimeSec: context.videoTimeSec,
          userMessage: content,
          recentMessages,
          transcript: {
            startSec: context.transcript.startSec,
            endSec: context.transcript.endSec,
            lines: context.transcript.lines,
          },
          code: {
            language: context.code.language,
            codeHash: context.code.codeHash,
            code: context.code.code,
            fileName: context.code.fileName,
          },
          lesson: context.lesson,
          lastError: context.lastError,
        };

        let response: Response;

        try {
          const token = await getToken({ template: "convex" });
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }

          response = await fetch("/api/nio", {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          });
        } catch {
          updateLocalMessage(assistantTempId, (message) => ({
            ...message,
            content: "Unable to reach the assistant service.",
            isStreaming: false,
          }));
          setStreamError("Unable to reach the assistant service.");
          return;
        }

        if (!response.ok) {
          let errorMessage = "Assistant request failed.";

          try {
            const body = (await response.json()) as {
              error?: { message?: string };
            };
            if (body.error?.message) {
              errorMessage = body.error.message;
            }
          } catch {
            errorMessage = `Assistant request failed (${response.status}).`;
          }

          updateLocalMessage(assistantTempId, (message) => ({
            ...message,
            content: errorMessage,
            isStreaming: false,
          }));
          setStreamError(errorMessage);
          return;
        }

        if (!response.body) {
          updateLocalMessage(assistantTempId, (message) => ({
            ...message,
            content: "Assistant response stream missing.",
            isStreaming: false,
          }));
          setStreamError("Assistant response stream missing.");
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = ""; // accumulate full response outside React state
        let receivedDone = false;
        let receivedError = false;

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const chunks = buffer.split("\n\n");
            buffer = chunks.pop() ?? "";

            for (const chunk of chunks) {
              const event = parseSseEvent(chunk.trim());
              if (!event) {
                continue;
              }

              if (event.type === "token") {
                fullText += event.token;
                // Push token directly to StreamingText — no React state
                onStreamTokenRef.current?.(event.token);
              }

              if (event.type === "done") {
                receivedDone = true;
                // Single React state update with final text
                updateLocalMessage(assistantTempId, (message) => ({
                  ...message,
                  content: event.finalText,
                  isStreaming: false,
                }));
              }

              if (event.type === "error") {
                receivedError = true;
                if (event.code === "NO_API_KEY") {
                  setNoApiKey(true);
                }
                updateLocalMessage(assistantTempId, (message) => ({
                  ...message,
                  content: event.message,
                  isStreaming: false,
                }));
                setStreamError(event.message);
              }
            }
          }
        } catch {
          // SSE read loop failed (network error, aborted stream)
          if (!receivedDone && !receivedError) {
            updateLocalMessage(assistantTempId, (message) => ({
              ...message,
              content: fullText || "Connection to assistant lost.",
              isStreaming: false,
            }));
            setStreamError("Connection to assistant lost.");
          }
          return;
        }

        if (!receivedDone && !receivedError) {
          updateLocalMessage(assistantTempId, (message) => ({
            ...message,
            content: fullText || "Assistant response interrupted.",
            isStreaming: false,
          }));
          setStreamError("Assistant response interrupted.");
        }
      } finally {
        // Always reset stream state so the input is never permanently stuck
        setStreamState((prev) => (prev === "streaming" ? "idle" : prev));
      }
    },
    // mergedMessages and streamState read from refs to keep sendMessage stable
    [
      activeThreadId,
      createMessage,
      ensureThread,
      getToken,
      isConvexEnabled,
      lessonId,
      lectureLabel,
      updateLocalMessage,
      logEvent,
    ],
  );

  return {
    thread: thread ?? null,
    messages: mergedMessages,
    threadId: activeThreadId ?? null,
    streamState,
    streamError,
    noApiKey,
    sendMessage,
    onStreamTokenRef,
  };
};

export { useChatThread };
