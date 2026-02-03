"use client";

import type { ReactElement } from "react";
import { useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { FunctionReference } from "convex/server";

type LessonInfo = {
  id: string;
  title: string;
  order: number;
  durationSec: number;
  transcriptStatus?: string;
  completionCount: number;
  eventCount: number;
};

type CourseInfo = {
  id: string;
  title: string;
  lessonCount: number;
  lessons: LessonInfo[];
};

const contentOverviewRef = makeFunctionReference<"query">(
  "ops:getContentOverview",
) as FunctionReference<"query", "public", Record<string, never>, CourseInfo[]>;

const formatDuration = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const statusColor = (status?: string): string => {
  switch (status) {
    case "ok":
      return "text-green-400";
    case "warn":
      return "text-yellow-400";
    case "error":
      return "text-red-400";
    case "missing":
      return "text-muted";
    default:
      return "text-muted";
  }
};

const ContentOverview = (): ReactElement => {
  const data = useQuery(contentOverviewRef);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Content</h1>

      {data === undefined ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted">No courses found.</p>
      ) : (
        data.map((course) => (
          <div
            key={course.id}
            className="rounded-lg border border-border bg-surface"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="font-medium text-foreground">{course.title}</h2>
              <span className="font-mono text-xs text-muted">
                {course.lessonCount} lessons
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-border bg-surface-muted">
                  <tr>
                    <th className="px-4 py-2 text-left font-mono font-medium text-muted">
                      #
                    </th>
                    <th className="px-4 py-2 text-left font-mono font-medium text-muted">
                      Title
                    </th>
                    <th className="px-4 py-2 text-left font-mono font-medium text-muted">
                      Duration
                    </th>
                    <th className="px-4 py-2 text-left font-mono font-medium text-muted">
                      Transcript
                    </th>
                    <th className="px-4 py-2 text-right font-mono font-medium text-muted">
                      Completions
                    </th>
                    <th className="px-4 py-2 text-right font-mono font-medium text-muted">
                      Events
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {course.lessons.map((lesson) => (
                    <tr
                      key={lesson.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-2 font-mono text-muted">
                        {lesson.order}
                      </td>
                      <td className="px-4 py-2 text-foreground">
                        {lesson.title}
                      </td>
                      <td className="px-4 py-2 font-mono text-muted">
                        {formatDuration(lesson.durationSec)}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`font-mono ${statusColor(lesson.transcriptStatus)}`}
                        >
                          {lesson.transcriptStatus ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-foreground">
                        {lesson.completionCount}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-foreground">
                        {lesson.eventCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export { ContentOverview };
