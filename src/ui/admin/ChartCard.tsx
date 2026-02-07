"use client";

import type { ReactElement, ReactNode } from "react";

type ChartCardProps = {
  title: string;
  children: ReactNode;
};

const ChartCard = ({ title, children }: ChartCardProps): ReactElement => (
  <div className="rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:border-accent/20 hover:shadow-md">
    <h3 className="mb-3 text-xs font-semibold font-mono uppercase tracking-[0.15em] text-accent">
      {title}
    </h3>
    <div className="h-52">{children}</div>
  </div>
);

export { ChartCard };
