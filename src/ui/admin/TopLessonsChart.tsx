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

const ACCENT = "#00FF66";

const TopLessonsChart = ({ data }: TopLessonsChartProps): ReactElement => (
  <ChartCard title="Top Lessons by Events">
    {data && data.length > 0 ? (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#666" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="title"
            tick={{ fontSize: 10, fill: "#999" }}
            width={120}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: string) =>
              v.length > 18 ? v.slice(0, 18) + "…" : v
            }
          />
          <Tooltip
            contentStyle={{
              background: "#111",
              border: "1px solid #333",
              borderRadius: 6,
              fontSize: 12,
              fontFamily: "monospace",
            }}
            labelStyle={{ color: "#999" }}
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
