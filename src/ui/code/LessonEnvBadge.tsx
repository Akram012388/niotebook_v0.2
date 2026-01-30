/**
 * LessonEnvBadge — small pill showing the active lesson environment.
 *
 * Displays something like "CS50x · C" or "Sandbox" in the CodePane header.
 */
import type { ReactElement } from "react";
import type { LessonEnvironment } from "../../domain/lessonEnvironment";

type LessonEnvBadgeProps = {
  environment: LessonEnvironment;
};

const LANGUAGE_LABELS: Record<string, string> = {
  js: "JS",
  python: "Python",
  html: "HTML",
  c: "C",
};

const LessonEnvBadge = ({
  environment,
}: LessonEnvBadgeProps): ReactElement => {
  const langLabel =
    LANGUAGE_LABELS[environment.primaryLanguage] ??
    environment.primaryLanguage.toUpperCase();

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-text-muted">
      <span>{environment.name}</span>
      <span className="text-border">·</span>
      <span>{langLabel}</span>
    </span>
  );
};

export { LessonEnvBadge };
export type { LessonEnvBadgeProps };
