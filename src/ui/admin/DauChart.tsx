"use client";

import type { ReactElement } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";

type DauPoint = { date: string; count: number };

type DauChartProps = {
  data: DauPoint[] | undefined;
};

const ACCENT = "#00FF66";

const DauChart = ({ data }: DauChartProps): ReactElement => (
  <ChartCard title="Daily Active Users">
    {data ? (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="dauFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.3} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#666" }}
            tickFormatter={(v: string) => v.slice(5)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#666" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
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
          <Area
            type="monotone"
            dataKey="count"
            stroke={ACCENT}
            strokeWidth={2}
            fill="url(#dauFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    ) : (
      <div className="flex h-full items-center justify-center text-sm text-muted">
        Loading…
      </div>
    )}
  </ChartCard>
);

export { DauChart };
export type { DauPoint };
