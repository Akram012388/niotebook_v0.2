"use client";

import type { ReactElement } from "react";

type KpiCardProps = {
  label: string;
  value: number | undefined;
  previousValue?: number;
};

const KpiCard = ({
  label,
  value,
  previousValue,
}: KpiCardProps): ReactElement => {
  const delta =
    value !== undefined && previousValue !== undefined && previousValue > 0
      ? ((value - previousValue) / previousValue) * 100
      : null;

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">
        {label}
      </p>
      <div className="mt-2 flex items-end gap-2">
        <p className="font-mono text-2xl font-semibold text-foreground">
          {value === undefined ? "—" : value.toLocaleString()}
        </p>
        {delta !== null && (
          <span
            className={`font-mono text-xs ${
              delta >= 0 ? "text-status-success" : "text-status-error"
            }`}
          >
            {delta >= 0 ? "↑" : "↓"}
            {Math.abs(delta).toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
};

export { KpiCard };
