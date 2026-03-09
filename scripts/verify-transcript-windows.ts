/**
 * CI verification utility — calls ingest:verifyTranscriptWindows and exits
 * non-zero if any lesson has transcriptStatus="error". Used as a post-ingest
 * gate in the _refresh-convex.yml and e2e.yml workflows.
 *
 * Usage: CONVEX_URL=<url> NIOTEBOOK_INGEST_TOKEN=<token> bun ./scripts/verify-transcript-windows.ts
 */
import { ConvexHttpClient } from "convex/browser";
import type { FunctionReference } from "convex/server";

const verifyTranscriptQuery =
  "ingest:verifyTranscriptWindows" as unknown as FunctionReference<"query">;

const ensureEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required for transcript verification.`);
  }
  return value;
};

const main = async (): Promise<void> => {
  const convexUrl = ensureEnv("CONVEX_URL");
  const ingestToken = ensureEnv("NIOTEBOOK_INGEST_TOKEN");
  const lessonId = process.env.NEXT_PUBLIC_DEFAULT_LESSON_ID;
  const client = new ConvexHttpClient(convexUrl, {
    skipConvexDeploymentUrlCheck: true,
  });

  const payload: Record<string, string> = { ingestToken };
  if (lessonId) {
    payload.defaultLessonId = lessonId;
  }
  const result = (await client.query(
    verifyTranscriptQuery,
    payload as never,
  )) as {
    lectureTenCount: number;
    lectureZeroCount: number;
    lectureZeroLabel?: string;
    errorCount: number;
    errorSlugs: string[];
  };

  console.log(
    `Verified Lecture 10: ${result.lectureTenCount} transcript segments (960-1020).`,
  );
  const lectureZeroLabel = result.lectureZeroLabel ?? "Lecture 0";
  console.log(
    `Verified ${lectureZeroLabel}: ${result.lectureZeroCount} transcript segments (0-60).`,
  );

  if (result.errorCount > 0) {
    throw new Error(
      `${result.errorCount} lesson(s) have transcriptStatus="error" in Convex: ${result.errorSlugs.join(", ")}`,
    );
  }
};

main().catch((error) => {
  console.error(
    error instanceof Error ? (error.stack ?? error.message) : error,
  );
  process.exit(1);
});
