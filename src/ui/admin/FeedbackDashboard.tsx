"use client";

import { type ReactElement, useState } from "react";
import { useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { FunctionReference } from "convex/server";

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

const formatDate = (ms: number): string =>
  new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const RatingStars = ({ rating }: { rating: number }): ReactElement => {
  return (
    <span className="text-sm">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < rating ? "text-status-warning" : "text-text-muted"}
        >
          ★
        </span>
      ))}
    </span>
  );
};

const FeedbackDashboard = (): ReactElement => {
  const [surfaceFilter, setSurfaceFilter] = useState<string>("all");

  const feedback = useQuery(listAllRef);

  const categories = feedback
    ? [...new Set(feedback.map((f) => f.category))]
    : [];

  const filtered = feedback?.filter(
    (f) => surfaceFilter === "all" || f.category === surfaceFilter,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Feedback</h1>
        <select
          value={surfaceFilter}
          onChange={(e) => setSurfaceFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
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
        <div className="rounded-xl border border-dashed border-border bg-surface-muted px-6 py-12 text-center">
          <p className="text-sm text-muted">No feedback submitted yet.</p>
          <p className="mt-1 text-xs text-muted">
            Feedback events will appear here once users submit feedback.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-muted">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-muted">
                  User
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted">
                  Category
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted">
                  Rating
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted">
                  Notes
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted">
                  Lesson
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered === undefined ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    Loading...
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <tr
                    key={entry._id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-2 font-mono text-xs text-foreground">
                      {entry.userId}
                    </td>
                    <td className="px-4 py-2 text-foreground">
                      {entry.category}
                    </td>
                    <td className="px-4 py-2">
                      <RatingStars rating={entry.rating} />
                    </td>
                    <td className="px-4 py-2 text-muted">
                      {entry.notes ?? "—"}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-muted">
                      {entry.lessonId ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-muted">
                      {formatDate(entry.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export { FeedbackDashboard };
