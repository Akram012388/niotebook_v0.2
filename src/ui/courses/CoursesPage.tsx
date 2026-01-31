"use client";

import { type ReactElement } from "react";
import { useQuery } from "convex/react";
import { getCoursesRef } from "@/ui/content/convexContent";
import { getResumeDataRef } from "./convexResume";
import { CourseCard } from "./CourseCard";
import { CourseCarousel } from "./CourseCarousel";
import { ResumeCard } from "./ResumeCard";
import type { CourseId } from "@/domain/ids";

const CS50_TITLES = [
  "CS50x",
  "CS50P",
  "CS50AI",
  "CS50W",
  "CS50SQL",
];

const COMING_SOON = [
  { title: "MIT 6.006", provider: "MIT OpenCourseWare" },
  { title: "Stanford CS106A", provider: "Stanford" },
  { title: "Google IT Cert", provider: "Google" },
  { title: "Meta Frontend Dev", provider: "Meta" },
];

function CoursesPage(): ReactElement {
  const courses = useQuery(getCoursesRef);
  const resumeData = useQuery(getResumeDataRef);

  const cs50Courses = (courses ?? []).filter((c) =>
    CS50_TITLES.some((t) => c.title.includes(t)),
  );

  const hasResume = resumeData && resumeData.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-8">
      {hasResume && (
        <CourseCarousel title="Continue Learning">
          {resumeData.map((entry) => (
            <ResumeCard
              key={entry.lessonId}
              courseTitle={entry.courseTitle}
              lessonTitle={entry.lessonTitle}
              lessonId={entry.lessonId}
              videoTimeSec={entry.videoTimeSec}
            />
          ))}
        </CourseCarousel>
      )}

      <CourseCarousel title="Harvard CS50 Library">
        {cs50Courses.length > 0
          ? cs50Courses.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                provider="Harvard"
                lessonCount={0}
                variant="active"
              />
            ))
          : (courses ?? []).map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                provider="Harvard"
                lessonCount={0}
                variant="active"
              />
            ))}
      </CourseCarousel>

      <CourseCarousel title="Coming Soon">
        {COMING_SOON.map((item) => (
          <CourseCard
            key={item.title}
            id={"" as CourseId}
            title={item.title}
            provider={item.provider}
            lessonCount={0}
            variant="coming-soon"
          />
        ))}
      </CourseCarousel>
    </div>
  );
}

export { CoursesPage };
