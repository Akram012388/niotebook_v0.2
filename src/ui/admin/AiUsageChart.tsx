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

type AiPoint = { date: string; count: number };

type AiUsageChartProps = {
  data: AiPoint[] | undefined;
};

const ACCENT = "var(--accent)";

const AiUsageChart = ({ data }: AiUsageChartProps): ReactElement => (
  <ChartCard title="AI Requests / Day">
    {data ? (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--text-subtle)" }}
            tickFormatter={(v: string) => v.slice(5)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--text-subtle)" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
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
          <Bar dataKey="count" fill={ACCENT} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div className="flex h-full items-center justify-center text-sm text-muted">
        Loading…
      </div>
    )}
  </ChartCard>
);

export { AiUsageChart };
