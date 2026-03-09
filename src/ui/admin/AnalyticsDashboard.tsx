"use client";

import { type ReactElement, useState } from "react";
import { useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { FunctionReference } from "convex/server";

type EventLogEntry = {
  id: string;
  type: string;
  userId?: string;
  sessionId?: string;
  createdAt: number;
};

const eventLogRef = makeFunctionReference<"query">(
  "analytics:getEventLog",
) as FunctionReference<"query", "public", { limit: number }, EventLogEntry[]>;

const formatDate = (ms: number): string =>
  new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

type LimitOption = 50 | 100 | 200;

const AnalyticsDashboard = (): ReactElement => {
  const [limit, setLimit] = useState<LimitOption>(100);
  const [typeFilter, setTypeFilter] = useState("");
  const eventLog = useQuery(eventLogRef, { limit });

  const filtered = eventLog?.filter(
    (e) => !typeFilter || e.type.includes(typeFilter),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">
          Event Explorer
        </h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Filter by type..."
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-border bg-surface px-4 py-2 font-mono text-xs text-foreground placeholder:text-text-subtle transition-colors duration-150 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
          />
          <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
            {([50, 100, 200] as LimitOption[]).map((l) => (
              <button
                key={l}
                onClick={() => setLimit(l)}
                className={`rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-colors duration-150 ${
                  limit === l
                    ? "bg-accent text-white shadow-sm"
                    : "text-text-muted hover:text-foreground hover:bg-surface-muted"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-muted">
            <tr>
              <th className="px-4 py-3 text-left font-mono text-xs font-medium text-text-muted">
                Type
              </th>
              <th className="px-4 py-3 text-left font-mono text-xs font-medium text-text-muted">
                User
              </th>
              <th className="px-4 py-3 text-left font-mono text-xs font-medium text-text-muted">
                Session
              </th>
              <th className="px-4 py-3 text-left font-mono text-xs font-medium text-text-muted">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered === undefined ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-text-muted"
                >
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-text-muted"
                >
                  No events found.
                </td>
              </tr>
            ) : (
              filtered.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-border last:border-0 transition-colors duration-100 hover:bg-surface-muted/50"
                >
                  <td className="px-4 py-2.5">
                    <span className="rounded-md bg-accent-muted px-2 py-0.5 font-mono text-xs text-accent">
                      {event.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-text-muted">
                    {event.userId ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-text-muted">
                    {event.sessionId ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-text-muted">
                    {formatDate(event.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { AnalyticsDashboard };
