"use client";

import { useMemo, type ReactElement } from "react";
import { useQuery } from "convex/react";
import { getCoursesRef } from "@/ui/content/convexContent";
import { getResumeDataRef } from "./convexResume";
import { getCompletionCountsByCourseRef } from "./convexCompletions";
import { CourseCard } from "./CourseCard";
import { ResumeCard } from "./ResumeCard";
import { COMING_SOON_GROUPS } from "./comingSoonCourses";
import type { CourseId } from "@/domain/ids";

const CS50_TITLES = ["CS50x", "CS50P", "CS50AI", "CS50W", "CS50SQL", "CS50R"];

function CoursesPage(): ReactElement {
  const courses = useQuery(getCoursesRef);
  const resumeData = useQuery(getResumeDataRef);

  const cs50Courses = (courses ?? []).filter((c) =>
    CS50_TITLES.some((t) => c.title.includes(t)),
  );

  const courseIds = useMemo(
    () => cs50Courses.map((c) => c.id as string),
    [cs50Courses],
  );

  const completionCounts = useQuery(
    getCompletionCountsByCourseRef,
    courseIds.length > 0 ? { courseIds } : "skip",
  );

  const hasResume = resumeData && resumeData.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-12 px-6 py-10">
      {/* Page header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Course Catalog
        </h1>
        <p className="text-sm text-text-muted">
          Open-licensed courses from top universities. Watch lectures, code
          along, and get AI help.
        </p>
      </div>

      {/* Continue Learning */}
      {hasResume && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            Continue Learning
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {resumeData.map((entry) => (
              <ResumeCard
                key={entry.lessonId}
                courseTitle={entry.courseTitle}
                lessonTitle={entry.lessonTitle}
                lessonId={entry.lessonId}
                videoTimeSec={entry.videoTimeSec}
              />
            ))}
          </div>
        </section>
      )}

      {/* Harvard CS50 Library — active courses */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground">
            Harvard University
          </h2>
          <p className="text-xs text-text-muted">
            CS50 series — CC BY-NC-SA 4.0
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses === undefined
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[180px] animate-pulse rounded-xl bg-surface-muted"
                />
              ))
            : cs50Courses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  provider="Harvard"
                  lessonCount={0}
                  completedCount={
                    completionCounts?.[course.id as string] ?? 0
                  }
                  license={course.license}
                  variant="active"
                />
              ))}
        </div>
      </section>

      {/* Coming Soon — grouped by provider */}
      {COMING_SOON_GROUPS.map((group) => (
        <section key={group.provider} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-foreground">
              {group.provider}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {group.courses.map((item) => (
              <CourseCard
                key={item.title}
                id={"" as CourseId}
                title={item.title}
                description={item.description}
                provider={item.provider}
                sourceUrl={item.sourceUrl}
                license={item.license}
                lessonCount={0}
                variant="coming-soon"
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export { CoursesPage };
