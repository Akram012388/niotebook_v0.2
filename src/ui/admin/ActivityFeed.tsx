"use client";

import type { ReactElement } from "react";

type EventEntry = {
  id: string;
  type: string;
  userId?: string;
  sessionId?: string;
  createdAt: number;
};

type ActivityFeedProps = {
  events: EventEntry[] | undefined;
};

const formatTime = (ms: number): string =>
  new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const ActivityFeed = ({ events }: ActivityFeedProps): ReactElement => (
  <div className="rounded-lg border border-border bg-surface">
    <div className="border-b border-border px-4 py-3">
      <h3 className="text-xs font-medium tracking-wide text-muted uppercase">
        Recent Activity
      </h3>
    </div>
    <div className="max-h-64 overflow-y-auto">
      {events === undefined ? (
        <p className="px-4 py-6 text-center text-sm text-muted">Loading…</p>
      ) : events.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted">
          No events yet.
        </p>
      ) : (
        <table className="w-full text-xs">
          <tbody>
            {events.map((event) => (
              <tr
                key={event.id}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-2">
                  <span className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-foreground">
                    {event.type}
                  </span>
                </td>
                <td className="px-4 py-2 font-mono text-muted">
                  {event.userId ? event.userId.slice(0, 8) : "—"}
                </td>
                <td className="px-4 py-2 text-muted">
                  {formatTime(event.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);

export { ActivityFeed };
export type { EventEntry };
