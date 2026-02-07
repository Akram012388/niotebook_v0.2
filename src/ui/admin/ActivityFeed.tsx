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
  <div className="rounded-2xl border border-border bg-surface transition-all duration-200 hover:border-accent/20 hover:shadow-md">
    <div className="border-b border-border px-5 py-3.5">
      <h3 className="text-xs font-semibold font-mono uppercase tracking-[0.15em] text-accent">
        Recent Activity
      </h3>
    </div>
    <div className="max-h-72 overflow-y-auto">
      {events === undefined ? (
        <p className="px-5 py-8 text-center text-sm text-text-muted">
          Loading...
        </p>
      ) : events.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-text-muted">
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
                <td className="px-5 py-2.5">
                  <span className="rounded-md bg-accent-muted px-2 py-0.5 font-mono text-accent">
                    {event.type}
                  </span>
                </td>
                <td className="px-5 py-2.5 font-mono text-text-muted">
                  {event.userId ? event.userId.slice(0, 8) : "—"}
                </td>
                <td className="px-5 py-2.5 text-text-muted">
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
