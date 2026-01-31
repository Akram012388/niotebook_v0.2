"use client";

import { type ReactElement, useState } from "react";
import { useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { FunctionReference } from "convex/server";

type TimeRange = "1d" | "7d" | "30d";

const TIME_WINDOWS: Record<TimeRange, number> = {
  "1d": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

type EventLogEntry = {
  id: string;
  type: string;
  userId?: string;
  sessionId?: string;
  createdAt: number;
};

const activeUsersRef = makeFunctionReference<"query">(
  "ops:getActiveUsers",
) as FunctionReference<"query", "public", { timeWindowMs: number }, number>;

const sessionCountRef = makeFunctionReference<"query">(
  "ops:getSessionCount",
) as FunctionReference<"query", "public", { timeWindowMs: number }, number>;

const aiRequestCountRef = makeFunctionReference<"query">(
  "ops:getAiRequestCount",
) as FunctionReference<"query", "public", { timeWindowMs: number }, number>;

const eventLogRef = makeFunctionReference<"query">(
  "ops:getEventLog",
) as FunctionReference<"query", "public", { limit: number }, EventLogEntry[]>;

const totalLessonsRef = makeFunctionReference<"query">(
  "ops:getTotalLessons",
) as FunctionReference<"query", "public", Record<string, never>, number>;

const formatDate = (ms: number): string =>
  new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const KpiCard = ({
  label,
  value,
}: {
  label: string;
  value: number | undefined;
}): ReactElement => (
  <div className="rounded-xl border border-border bg-surface p-4">
    <p className="text-xs font-medium text-muted">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-foreground">
      {value === undefined ? "—" : value.toLocaleString()}
    </p>
  </div>
);

const AnalyticsDashboard = (): ReactElement => {
  const [range, setRange] = useState<TimeRange>("7d");
  const windowMs = TIME_WINDOWS[range];

  const activeUsers = useQuery(activeUsersRef, { timeWindowMs: windowMs });
  const sessions = useQuery(sessionCountRef, { timeWindowMs: windowMs });
  const aiRequests = useQuery(aiRequestCountRef, { timeWindowMs: windowMs });
  const totalLessons = useQuery(totalLessonsRef);
  const eventLog = useQuery(eventLogRef, { limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-0.5">
          {(["1d", "7d", "30d"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                range === r
                  ? "bg-foreground text-background"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Active Users" value={activeUsers} />
        <KpiCard label="Sessions" value={sessions} />
        <KpiCard label="AI Requests" value={aiRequests} />
        <KpiCard label="Total Lessons" value={totalLessons} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium text-foreground">
          Recent Events
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-muted">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-muted">
                  Type
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted">
                  User
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted">
                  Session
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {eventLog === undefined ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted"
                  >
                    Loading...
                  </td>
                </tr>
              ) : eventLog.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted"
                  >
                    No events recorded yet.
                  </td>
                </tr>
              ) : (
                eventLog.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-2">
                      <span className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                        {event.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-muted">
                      {event.userId ?? "—"}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-muted">
                      {event.sessionId ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-muted">
                      {formatDate(event.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export { AnalyticsDashboard };
