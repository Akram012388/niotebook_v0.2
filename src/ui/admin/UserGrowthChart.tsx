"use client";

import type { ReactElement } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";

type GrowthPoint = { date: string; count: number };

type UserGrowthChartProps = {
  data: GrowthPoint[] | undefined;
};

const UserGrowthChart = ({ data }: UserGrowthChartProps): ReactElement => (
  <ChartCard title="New Users / Day">
    {data ? (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
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
          <Line
            type="monotone"
            dataKey="count"
            stroke="#FAFAFA"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    ) : (
      <div className="flex h-full items-center justify-center text-sm text-muted">
        Loading…
      </div>
    )}
  </ChartCard>
);

export { UserGrowthChart };
