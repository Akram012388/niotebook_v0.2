"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MutableRefObject,
} from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { ChatMessageSummary, ChatThreadSummary } from "../../domain/chat";
import { orderChatMessages } from "../../domain/chat";
import type { NioChatRequest } from "../../domain/ai/types";
import { parseSseEvent } from "../../infra/ai/nioSse";
import { formatTimestamp } from "../formatTimestamp";
import type { ChatMessage, ChatStreamState } from "./chatTypes";
import type { EventLogResult } from "../../domain/events";
import { readChatCache, writeChatCache } from "../../infra/chatLocalCache";
import {
  createChatMessageRef,
  ensureChatThreadRef,
  getChatMessagesRef,
  getChatThreadRef,
} from "./convexChat";

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
  };
  lesson?: {
    title?: string;
    lectureNumber?: number;
    subtitlesUrl?: string;
    transcriptUrl?: string;
  };
};

type UseChatThreadResult = {
  thread: ChatThreadSummary | null;
  messages: ChatMessage[];
  threadId: string | null;
  streamState: ChatStreamState;
  streamError: string | null;
  sendMessage: (content: string, context: ChatSendContext) => Promise<void>;
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
  const { getToken } = useAuth();
  const isConvexEnabled = process.env.NEXT_PUBLIC_DISABLE_CONVEX !== "true";
  const [streamState, setStreamState] = useState<ChatStreamState>("idle");
  const [streamError, setStreamError] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);

  const thread = useQuery(
    getChatThreadRef,
    isConvexEnabled ? { lessonId } : "skip",
  );
  const ensureThread = useMutation(ensureChatThreadRef);

  const [localThreadId, setLocalThreadId] = useState<string | null>(null);

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

  const subscribe = useCallback(() => {
    return () => {};
  }, []);

  const isMounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const cachedMessages = useMemo(() => {
    if (!isMounted) return [];
    const cached = readChatCache(lessonId);
    return cached.map((message) => fromCachedMessage(message, lectureLabel));
  }, [isMounted, lectureLabel, lessonId]);

  const mergedMessages = useMemo(() => {
    const displayMessages = remoteMessages.map((message) =>
      toChatMessage(message, lectureLabel),
    );
    const remoteIds = new Set(displayMessages.map((message) => message.id));
    const remoteRequestIds = new Set(
      displayMessages
        .map((message) => message.requestId)
        .filter((requestId): requestId is string => Boolean(requestId)),
    );
    const cachedOnly = cachedMessages.filter(
      (message) =>
        !remoteIds.has(message.id) &&
        (!message.requestId || !remoteRequestIds.has(message.requestId)),
    );
    const cachedIds = new Set(cachedOnly.map((message) => message.id));
    const localOnly = localMessages.filter(
      (message) =>
        !remoteIds.has(message.id) &&
        !cachedIds.has(message.id) &&
        (!message.requestId || !remoteRequestIds.has(message.requestId)),
    );
    const combined = [
      ...displayMessages,
      ...cachedOnly,
      ...localOnly.map((message) => ({
        ...message,
        badge: `${lectureLabel} • ${formatTimestamp(message.timestampSec)}`,
      })),
    ];

    return [...combined].sort(
      (left, right) => left.createdAt - right.createdAt,
    );
  }, [cachedMessages, lectureLabel, localMessages, remoteMessages]);

  useEffect(() => {
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
  }, [lessonId, mergedMessages]);

  const rafRef = useRef<number | null>(null);
  const mergedMessagesRef: MutableRefObject<ChatMessage[]> = useRef(mergedMessages);
  mergedMessagesRef.current = mergedMessages;
  const streamStateRef: MutableRefObject<ChatStreamState> = useRef(streamState);
  streamStateRef.current = streamState;

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

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
        return;
      }

      setStreamError(null);
      setStreamState("streaming");

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
              }).catch(() => undefined),
            ]);
          } catch {
            // Convex calls failed — continue with local-only thread
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
          },
          lesson: context.lesson,
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
        let tokenBuffer = "";
        let receivedDone = false;
        let receivedError = false;

        const flushTokens = (): void => {
          if (!tokenBuffer) {
            return;
          }

          const chunk = tokenBuffer;
          tokenBuffer = "";
          updateLocalMessage(assistantTempId, (message) => ({
            ...message,
            content: message.content + chunk,
          }));
        };

        const scheduleFlush = (): void => {
          if (rafRef.current !== null) {
            return;
          }

          rafRef.current = window.requestAnimationFrame(() => {
            rafRef.current = null;
            flushTokens();
          });
        };

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
                tokenBuffer += event.token;
                scheduleFlush();
              }

              if (event.type === "done") {
                flushTokens();
                receivedDone = true;
                updateLocalMessage(assistantTempId, (message) => ({
                  ...message,
                  content: event.finalText,
                  isStreaming: false,
                }));
              }

              if (event.type === "error") {
                flushTokens();
                receivedError = true;
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
            flushTokens();
            updateLocalMessage(assistantTempId, (message) => ({
              ...message,
              content:
                message.content || "Connection to assistant lost.",
              isStreaming: false,
            }));
            setStreamError("Connection to assistant lost.");
          }
          return;
        }

        if (!receivedDone && !receivedError) {
          flushTokens();
          updateLocalMessage(assistantTempId, (message) => ({
            ...message,
            content: message.content || "Assistant response interrupted.",
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
    sendMessage,
  };
};

export { useChatThread };
