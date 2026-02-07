"use client";

import { type ReactElement, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { FunctionReference } from "convex/server";

type UserRow = {
  id: string;
  email?: string;
  role: string;
  createdAt: number;
};

type FeedbackEntry = {
  _id: string;
  _creationTime: number;
  userId: string;
  category: string;
  rating: number;
  notes?: string;
  lessonId?: string;
  createdAt: number;
};

const listAllRef = makeFunctionReference<"query">(
  "feedback:listAll",
) as FunctionReference<
  "query",
  "public",
  Record<string, never>,
  FeedbackEntry[]
>;

const usersListAllRef = makeFunctionReference<"query">(
  "users:listAll",
) as FunctionReference<"query", "public", Record<string, never>, UserRow[]>;

const formatDate = (ms: number): string =>
  new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const RatingStars = ({ rating }: { rating: number }): ReactElement => (
  <div className="flex items-center gap-1.5">
    {Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-sm ${i < rating ? "text-accent" : "text-text-subtle"}`}
      >
        ★
      </span>
    ))}
  </div>
);

const FeedbackCard = ({
  entry,
  email,
}: {
  entry: FeedbackEntry;
  email?: string;
}): ReactElement => {
  const categories = entry.category.split(", ").filter(Boolean);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:border-accent/20 hover:shadow-md">
      {/* Header — user + date */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5 truncate">
          {email && (
            <span className="truncate text-xs font-medium text-foreground">
              {email}
            </span>
          )}
          <span className="font-mono text-[10px] text-text-subtle">
            {entry.userId.slice(0, 12)}…
          </span>
        </div>
        <span className="text-xs text-text-muted">
          {formatDate(entry.createdAt)}
        </span>
      </div>

      {/* Rating */}
      <div className="flex flex-col gap-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
          Experience rating
        </div>
        <RatingStars rating={entry.rating} />
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
          Category
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((label) => (
            <span
              key={label}
              className="rounded-full border border-accent bg-accent px-3 py-1 text-xs text-white shadow-sm"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Notes */}
      {entry.notes && entry.notes.trim().length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            Notes
          </div>
          <div className="whitespace-pre-wrap rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs text-foreground">
            {entry.notes}
          </div>
        </div>
      )}

      {/* Lesson context (if present) */}
      {entry.lessonId && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            Lesson
          </span>
          <span className="font-mono text-xs text-text-muted">
            {entry.lessonId}
          </span>
        </div>
      )}
    </div>
  );
};

const FeedbackDashboard = (): ReactElement => {
  const [surfaceFilter, setSurfaceFilter] = useState<string>("all");

  const feedback = useQuery(listAllRef);
  const users = useQuery(usersListAllRef);

  const emailMap = useMemo(() => {
    const map = new Map<string, string>();
    if (users) {
      for (const u of users) {
        if (u.email) map.set(u.id, u.email);
      }
    }
    return map;
  }, [users]);

  const categories = feedback
    ? [...new Set(feedback.flatMap((f) => f.category.split(", ")))]
    : [];

  const filtered = feedback?.filter(
    (f) =>
      surfaceFilter === "all" ||
      f.category.split(", ").includes(surfaceFilter),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Feedback</h1>
        <select
          value={surfaceFilter}
          onChange={(e) => setSurfaceFilter(e.target.value)}
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground transition-colors duration-150 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
        >
          <option value="all">All categories</option>
          {categories.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {feedback !== undefined && feedback.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-muted px-6 py-12 text-center">
          <p className="text-sm text-text-muted">No feedback submitted yet.</p>
          <p className="mt-1 text-xs text-text-muted">
            Feedback events will appear here once users submit feedback.
          </p>
        </div>
      ) : filtered === undefined ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((entry) => (
            <FeedbackCard
              key={entry._id}
              entry={entry}
              email={emailMap.get(entry.userId)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export { FeedbackDashboard };
