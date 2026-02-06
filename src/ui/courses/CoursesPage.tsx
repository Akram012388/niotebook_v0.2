"use client";

import { useMemo, useState, type ReactElement } from "react";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  getCoursesRef,
  getLessonCountsByCourseRef,
} from "@/ui/content/convexContent";
import { getResumeDataRef } from "./convexResume";
import { getCompletionCountsByCourseRef } from "./convexCompletions";
import { CourseCard } from "./CourseCard";
import { ResumeCard } from "./ResumeCard";
import { COMING_SOON_GROUPS } from "./comingSoonCourses";
import { NotebookFrame } from "@/ui/shared/NotebookFrame";
import type { CourseId } from "@/domain/ids";

const CS50_TITLES = ["CS50x", "CS50P", "CS50AI", "CS50W", "CS50SQL", "CS50R"];

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

function CoursesPage(): ReactElement {
  const courses = useQuery(getCoursesRef);
  const lessonCounts = useQuery(getLessonCountsByCourseRef);
  const resumeData = useQuery(getResumeDataRef);

  const [searchQuery, setSearchQuery] = useState("");

  const normalized = searchQuery.trim().toLowerCase();

  const cs50Courses = useMemo(() => {
    const all = (courses ?? []).filter((c) =>
      CS50_TITLES.some((t) => c.title.includes(t)),
    );
    if (!normalized) return all;
    return all.filter(
      (c) =>
        c.title.toLowerCase().includes(normalized) ||
        (c.description?.toLowerCase().includes(normalized) ?? false),
    );
  }, [courses, normalized]);

  const filteredComingSoon = useMemo(() => {
    if (!normalized) return COMING_SOON_GROUPS;
    return COMING_SOON_GROUPS.map((group) => ({
      ...group,
      courses: group.courses.filter(
        (item) =>
          item.title.toLowerCase().includes(normalized) ||
          item.description.toLowerCase().includes(normalized) ||
          item.provider.toLowerCase().includes(normalized),
      ),
    })).filter((group) => group.courses.length > 0);
  }, [normalized]);

  const courseIds = useMemo(
    () => cs50Courses.map((c) => c.id as string),
    [cs50Courses],
  );

  const completionCounts = useQuery(
    getCompletionCountsByCourseRef,
    courseIds.length > 0 ? { courseIds } : "skip",
  );

  const hasResume = resumeData && resumeData.length > 0;

  const content = (
    <div className="flex flex-col gap-14">
      {/* Page header */}
      <motion.div
        className="flex flex-col gap-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Course Catalog
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-text-muted">
          Open-licensed courses from top universities. Watch lectures, code
          along, and get AI help.
        </p>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search courses"
          className="mt-1 w-full max-w-md rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-text-subtle transition-colors focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
        />
      </motion.div>

      {/* Continue Learning */}
      {hasResume && (
        <motion.section
          className="flex flex-col gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent/60">
            Continue Learning
          </p>
          <div className="flex gap-4 overflow-x-auto overflow-y-visible pb-4 pt-4 -mb-2 -mt-2 px-2 -mx-2">
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
        </motion.section>
      )}

      {/* Harvard CS50 Library — active courses */}
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent/60">
            Harvard University
          </p>
          <p className="text-xs text-text-muted">
            CS50 series — CC BY-NC-SA 4.0
          </p>
        </div>
        <motion.div
          className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {courses === undefined
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[200px] nio-shimmer rounded-2xl"
                />
              ))
            : cs50Courses.map((course, i) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  provider="Harvard"
                  lessonCount={lessonCounts?.[course.id as string] ?? 0}
                  completedCount={
                    completionCounts?.[course.id as string] ?? 0
                  }
                  license={course.license}
                  variant="active"
                  index={i}
                />
              ))}
        </motion.div>
      </section>

      {/* Coming Soon — grouped by provider */}
      {filteredComingSoon.map((group) => (
        <section key={group.provider} className="flex flex-col gap-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent/60">
            {group.provider}
          </p>
          <motion.div
            className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {group.courses.map((item, i) => (
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
                index={i}
              />
            ))}
          </motion.div>
        </section>
      ))}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-12">
      <div className="hidden sm:block">
        <NotebookFrame compact>{content}</NotebookFrame>
      </div>
      <div className="sm:hidden">{content}</div>
    </div>
  );
}

export { CoursesPage };
