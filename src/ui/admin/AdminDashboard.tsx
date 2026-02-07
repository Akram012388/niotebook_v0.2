"use client";

import { type ReactElement, useState } from "react";
import { useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { FunctionReference } from "convex/server";
import { KpiCard } from "./KpiCard";
import { DauChart } from "./DauChart";
import type { DauPoint } from "./DauChart";
import { AiUsageChart } from "./AiUsageChart";
import { UserGrowthChart } from "./UserGrowthChart";
import { TopLessonsChart } from "./TopLessonsChart";
import { ActivityFeed } from "./ActivityFeed";
import type { EventEntry } from "./ActivityFeed";

type TimeRange = "1d" | "7d" | "30d";

const TIME_WINDOWS: Record<TimeRange, number> = {
  "1d": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

const DAYS: Record<TimeRange, number> = { "1d": 1, "7d": 7, "30d": 30 };

type TopLesson = { title: string; eventCount: number };

const activeUsersRef = makeFunctionReference<"query">(
  "ops:getActiveUsers",
) as FunctionReference<"query", "public", { timeWindowMs: number }, number>;

const sessionCountRef = makeFunctionReference<"query">(
  "ops:getSessionCount",
) as FunctionReference<"query", "public", { timeWindowMs: number }, number>;

const aiRequestCountRef = makeFunctionReference<"query">(
  "ops:getAiRequestCount",
) as FunctionReference<"query", "public", { timeWindowMs: number }, number>;

const codeExecCountRef = makeFunctionReference<"query">(
  "ops:getCodeExecutionCount",
) as FunctionReference<"query", "public", { timeWindowMs: number }, number>;

const totalLessonsRef = makeFunctionReference<"query">(
  "ops:getTotalLessons",
) as FunctionReference<"query", "public", Record<string, never>, number>;

const dauSeriesRef = makeFunctionReference<"query">(
  "ops:getDailyActiveUsersSeries",
) as FunctionReference<"query", "public", { days: number }, DauPoint[]>;

const aiSeriesRef = makeFunctionReference<"query">(
  "ops:getAiUsageSeries",
) as FunctionReference<"query", "public", { days: number }, DauPoint[]>;

const userGrowthRef = makeFunctionReference<"query">(
  "ops:getUserGrowth",
) as FunctionReference<"query", "public", { days: number }, DauPoint[]>;

const topLessonsRef = makeFunctionReference<"query">(
  "ops:getTopLessons",
) as FunctionReference<"query", "public", { limit: number }, TopLesson[]>;

const eventLogRef = makeFunctionReference<"query">(
  "ops:getEventLog",
) as FunctionReference<"query", "public", { limit: number }, EventEntry[]>;

const AdminDashboard = (): ReactElement => {
  const [range, setRange] = useState<TimeRange>("7d");
  const windowMs = TIME_WINDOWS[range];
  const days = DAYS[range];

  const activeUsers = useQuery(activeUsersRef, { timeWindowMs: windowMs });
  const sessions = useQuery(sessionCountRef, { timeWindowMs: windowMs });
  const aiRequests = useQuery(aiRequestCountRef, { timeWindowMs: windowMs });
  const codeExecs = useQuery(codeExecCountRef, { timeWindowMs: windowMs });
  const totalLessons = useQuery(totalLessonsRef);

  const dauSeries = useQuery(dauSeriesRef, { days });
  const aiSeries = useQuery(aiSeriesRef, { days });
  const userGrowth = useQuery(userGrowthRef, { days });
  const topLessons = useQuery(topLessonsRef, { limit: 8 });
  const eventLog = useQuery(eventLogRef, { limit: 20 });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
          {(["1d", "7d", "30d"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-colors duration-150 ${
                range === r
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-muted hover:text-foreground hover:bg-surface-muted"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Section */}
      <section className="space-y-3">
        <p className="text-xs font-semibold font-mono uppercase tracking-[0.15em] text-accent">
          Overview
        </p>
        <div className="grid grid-cols-5 gap-4">
          <KpiCard label="Active Users" value={activeUsers} />
          <KpiCard label="Sessions" value={sessions} />
          <KpiCard label="AI Requests" value={aiRequests} />
          <KpiCard label="Code Runs" value={codeExecs} />
          <KpiCard label="Total Lessons" value={totalLessons} />
        </div>
      </section>

      {/* Charts Section */}
      <section className="space-y-3">
        <p className="text-xs font-semibold font-mono uppercase tracking-[0.15em] text-accent">
          Trends
        </p>
        <div className="grid grid-cols-2 gap-4">
          <DauChart data={dauSeries} />
          <AiUsageChart data={aiSeries} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <UserGrowthChart data={userGrowth} />
          <TopLessonsChart data={topLessons} />
        </div>
      </section>

      {/* Activity Section */}
      <section className="space-y-3">
        <ActivityFeed events={eventLog} />
      </section>
    </div>
  );
};

export { AdminDashboard };
