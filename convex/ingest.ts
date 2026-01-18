"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { TranscriptStatus } from "../src/domain/content";
import { evaluateTranscriptIngest } from "../src/domain/ingest";
import {
  buildWeekUrl,
  CS50_X_WEEKS_URL,
  fetchSrt,
  fetchWeekHtml,
  parseSrt,
  parseWeekHtml,
  parseWeekSlugs,
} from "../src/infra/cs50Ingest";

const upsertLessonRef = internal.ingestMutations.upsertLessonFromIngest;

const applyTranscriptRef = internal.ingestMutations.applyTranscriptIngest;

const systemEventRef = internal.events.logSystemEvent;

const INGEST_VERSION = 1;

const ingestCourse = action({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args): Promise<{ ok: true; weeks: number }> => {
    const weeksIndex = await fetchWeekHtml(CS50_X_WEEKS_URL);

    if (!weeksIndex.ok || !weeksIndex.html) {
      throw new Error("Failed to fetch CS50 weeks index.");
    }

    const slugs = parseWeekSlugs(weeksIndex.html);
    let weeksParsed = 0;

    for (const slug of slugs) {
      const weekResponse = await fetchWeekHtml(buildWeekUrl(slug));

      if (!weekResponse.ok || !weekResponse.html) {
        continue;
      }

      const week = parseWeekHtml(slug, weekResponse.html);

      for (const lesson of week.lessons) {
        await ctx.runMutation(upsertLessonRef, {
          courseId: args.courseId,
          videoId: lesson.videoId,
          title: lesson.title,
          durationSec: lesson.durationSec,
          order: lesson.order,
          subtitlesUrl: lesson.subtitlesUrl,
          transcriptUrl: lesson.transcriptUrl,
        });
      }

      weeksParsed += 1;
    }

    return { ok: true, weeks: weeksParsed };
  },
});

const ingestTranscripts = action({
  args: {
    lessonId: v.id("lessons"),
    lessonDurationSec: v.number(),
    transcriptUrl: v.string(),
    subtitlesUrl: v.optional(v.string()),
    actorUserId: v.optional(v.id("users")),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ ok: true; status: TranscriptStatus }> => {
    const srtResponse = await fetchSrt(args.transcriptUrl);

    if (!srtResponse.ok || !srtResponse.srt) {
      await ctx.runMutation(systemEventRef, {
        eventType: "transcript_ingest_failed",
        lessonId: args.lessonId,
        metadata: {
          lessonId: args.lessonId,
          reason: `Failed to fetch transcript (${srtResponse.status})`,
          actorUserId: args.actorUserId,
        },
      });

      await ctx.runMutation(applyTranscriptRef, {
        lessonId: args.lessonId,
        transcriptStatus: "missing",
        transcriptDurationSec: 0,
        segmentCount: 0,
        transcriptUrl: args.transcriptUrl,
        subtitlesUrl: args.subtitlesUrl,
        ingestVersion: INGEST_VERSION,
        segments: [],
      });

      return { ok: true, status: "missing" };
    }

    await ctx.runMutation(systemEventRef, {
      eventType: "transcript_ingest_started",
      lessonId: args.lessonId,
      metadata: {
        lessonId: args.lessonId,
        actorUserId: args.actorUserId,
      },
    });

    const parsed = parseSrt(srtResponse.srt);
    const evaluation = evaluateTranscriptIngest(
      parsed.segments,
      args.lessonDurationSec,
    );

    const transcriptDurationSec = evaluation.transcriptDurationSec ?? 0;
    const nextStatus = evaluation.status as TranscriptStatus;

    await ctx.runMutation(applyTranscriptRef, {
      lessonId: args.lessonId,
      transcriptStatus: nextStatus,
      transcriptDurationSec,
      segmentCount: evaluation.segmentCount,
      transcriptUrl: args.transcriptUrl,
      subtitlesUrl: args.subtitlesUrl,
      ingestVersion: INGEST_VERSION,
      segments: parsed.segments,
    });

    if (evaluation.status === "warn") {
      await ctx.runMutation(systemEventRef, {
        eventType: "transcript_duration_warn",
        lessonId: args.lessonId,
        metadata: {
          lessonId: args.lessonId,
          lessonDurationSec: args.lessonDurationSec,
          transcriptDurationSec,
          actorUserId: args.actorUserId,
        },
      });
    }

    await ctx.runMutation(systemEventRef, {
      eventType: "transcript_ingest_succeeded",
      lessonId: args.lessonId,
      metadata: {
        lessonId: args.lessonId,
        segmentCount: evaluation.segmentCount,
        transcriptDurationSec,
        actorUserId: args.actorUserId,
      },
    });

    return { ok: true, status: nextStatus };
  },
});

export { ingestCourse, ingestTranscripts };
