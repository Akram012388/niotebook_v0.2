import { ConvexHttpClient } from "convex/browser";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { NIOTEPAD_SUMMARIZE_SYSTEM } from "../../../../domain/nioPrompt";
import { fetchSubtitleWindow } from "../../../../infra/ai/subtitleFallback";
import { fetchYoutubeTranscriptWindow } from "../../../../infra/ai/youtubeTranscriptFallback";

const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";
const TRANSCRIPT_WINDOW_SEC = 15;

type SummarizeRequest = {
  lessonId: string;
  timeSec: number;
};

type SummarizeResponse = {
  summary: string;
};

type ErrorResponse = {
  error: { code: string; message: string };
};

const isConvexEnabled = (): boolean => {
  return process.env.NEXT_PUBLIC_DISABLE_CONVEX !== "true";
};

const fetchTranscriptWindow = async (args: {
  lessonId: string;
  startSec: number;
  endSec: number;
}): Promise<string[]> => {
  if (!isConvexEnabled()) return [];

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return [];

  const client = new ConvexHttpClient(convexUrl);
  const lesson = await client.query(api.content.getLesson, {
    lessonId: args.lessonId as Id<"lessons">,
  });

  if (!lesson) return [];

  // Try SRT subtitles first
  if (lesson.subtitlesUrl) {
    try {
      const lines = await fetchSubtitleWindow({
        subtitlesUrl: lesson.subtitlesUrl,
        startSec: args.startSec,
        endSec: args.endSec,
      });
      if (lines.length > 0) return lines;
    } catch {
      // Fall through to YouTube fallback
    }
  }

  // YouTube transcript fallback
  if (lesson.videoId) {
    try {
      const lines = await fetchYoutubeTranscriptWindow({
        videoId: lesson.videoId,
        startSec: args.startSec,
        endSec: args.endSec,
      });
      if (lines.length > 0) return lines;
    } catch {
      // No transcript available
    }
  }

  return [];
};

const callGemini = async (transcript: string): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${NIOTEPAD_SUMMARIZE_SYSTEM}\n\nTranscript excerpt:\n${transcript}`,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 0.3,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data: unknown = await response.json();
  if (
    typeof data === "object" &&
    data !== null &&
    "candidates" in data &&
    Array.isArray((data as Record<string, unknown>).candidates)
  ) {
    const candidates = (data as Record<string, unknown>)
      .candidates as unknown[];
    const first = candidates[0] as Record<string, unknown> | undefined;
    const content = first?.content as Record<string, unknown> | undefined;
    const parts = content?.parts as Array<{ text?: string }> | undefined;
    const text = parts?.[0]?.text;
    if (typeof text === "string") return text.trim();
  }

  throw new Error("Unexpected Gemini response format");
};

export const POST = async (
  request: Request,
): Promise<Response> => {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: { code: "invalid_json", message: "Invalid JSON body" } } satisfies ErrorResponse,
      { status: 400 },
    );
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("lessonId" in payload) ||
    !("timeSec" in payload) ||
    typeof (payload as SummarizeRequest).lessonId !== "string" ||
    typeof (payload as SummarizeRequest).timeSec !== "number"
  ) {
    return Response.json(
      {
        error: {
          code: "invalid_params",
          message: "Required: lessonId (string), timeSec (number)",
        },
      } satisfies ErrorResponse,
      { status: 400 },
    );
  }

  const { lessonId, timeSec } = payload as SummarizeRequest;

  const startSec = Math.max(0, timeSec - TRANSCRIPT_WINDOW_SEC);
  const endSec = timeSec + TRANSCRIPT_WINDOW_SEC;

  try {
    const lines = await fetchTranscriptWindow({ lessonId, startSec, endSec });

    if (lines.length === 0) {
      return Response.json(
        {
          error: {
            code: "no_transcript",
            message: "No transcript available for this moment",
          },
        } satisfies ErrorResponse,
        { status: 404 },
      );
    }

    const transcript = lines.join(" ");
    const summary = await callGemini(transcript);

    return Response.json({ summary } satisfies SummarizeResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Summarization failed";
    return Response.json(
      { error: { code: "summarize_failed", message } } satisfies ErrorResponse,
      { status: 500 },
    );
  }
};
