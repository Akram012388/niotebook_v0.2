"use client";

import type { ReactElement, ReactNode } from "react";

type ChartCardProps = {
  title: string;
  children: ReactNode;
};

const ChartCard = ({ title, children }: ChartCardProps): ReactElement => (
  <div className="rounded-lg border border-border bg-surface p-4">
    <h3 className="mb-3 text-xs font-medium tracking-wide text-muted uppercase">
      {title}
    </h3>
    <div className="h-52">{children}</div>
  </div>
);

export { ChartCard };
