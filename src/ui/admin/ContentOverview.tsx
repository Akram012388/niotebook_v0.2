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
      return "text-status-success";
    case "warn":
      return "text-status-warning";
    case "error":
      return "text-status-error";
    case "missing":
      return "text-text-muted";
    default:
      return "text-text-muted";
  }
};

const ContentOverview = (): ReactElement => {
  const data = useQuery(contentOverviewRef);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Content</h1>

      {data === undefined ? (
        <div className="flex items-center gap-3 py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
          <p className="text-sm text-text-muted">Loading...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-muted px-6 py-12 text-center">
          <p className="text-sm text-text-muted">No courses found.</p>
        </div>
      ) : (
        data.map((course) => (
          <div
            key={course.id}
            className="rounded-2xl border border-border bg-surface transition-all duration-200 hover:border-accent/20 hover:shadow-md"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="font-medium text-foreground">{course.title}</h2>
              <span className="rounded-full bg-accent-muted px-2.5 py-0.5 font-mono text-xs font-medium text-accent">
                {course.lessonCount} lessons
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-border bg-surface-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-mono text-xs font-medium text-text-muted">
                      #
                    </th>
                    <th className="px-4 py-3 text-left font-mono text-xs font-medium text-text-muted">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left font-mono text-xs font-medium text-text-muted">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left font-mono text-xs font-medium text-text-muted">
                      Transcript
                    </th>
                    <th className="px-4 py-3 text-right font-mono text-xs font-medium text-text-muted">
                      Completions
                    </th>
                    <th className="px-4 py-3 text-right font-mono text-xs font-medium text-text-muted">
                      Events
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {course.lessons.map((lesson) => (
                    <tr
                      key={lesson.id}
                      className="border-b border-border last:border-0 transition-colors duration-100 hover:bg-surface-muted/50"
                    >
                      <td className="px-4 py-2.5 font-mono text-text-muted">
                        {lesson.order}
                      </td>
                      <td className="px-4 py-2.5 text-foreground">
                        {lesson.title}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-text-muted">
                        {formatDuration(lesson.durationSec)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`font-mono ${statusColor(lesson.transcriptStatus)}`}
                        >
                          {lesson.transcriptStatus ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-foreground">
                        {lesson.completionCount}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-foreground">
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
