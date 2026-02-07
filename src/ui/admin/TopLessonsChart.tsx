"use client";

import type { ReactElement } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";

type TopLesson = { title: string; eventCount: number };

type TopLessonsChartProps = {
  data: TopLesson[] | undefined;
};

const ACCENT = "var(--accent)";

const TopLessonsChart = ({ data }: TopLessonsChartProps): ReactElement => (
  <ChartCard title="Top Lessons by Events">
    {data && data.length > 0 ? (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "var(--text-subtle)" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="title"
            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
            width={120}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: string) =>
              v.length > 18 ? v.slice(0, 18) + "…" : v
            }
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface-strong)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: 12,
              fontFamily: "monospace",
            }}
            labelStyle={{ color: "var(--text-muted)" }}
          />
          <Bar dataKey="eventCount" fill={ACCENT} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div className="flex h-full items-center justify-center text-sm text-muted">
        {data ? "No lesson data yet" : "Loading…"}
      </div>
    )}
  </ChartCard>
);

export { TopLessonsChart };
