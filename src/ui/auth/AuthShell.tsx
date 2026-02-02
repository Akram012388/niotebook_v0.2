"use client";

import type { ReactElement, ReactNode } from "react";
import { Wordmark } from "@/ui/brand/Wordmark";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

const AuthShell = ({
  title,
  subtitle,
  children,
}: AuthShellProps): ReactElement => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.18),_transparent_55%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] flex-col justify-center px-6 py-12">
        <div className="mb-6">
          <Wordmark height={20} />
          <h1 className="mt-3 text-3xl font-semibold text-foreground">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 max-w-md text-sm text-text-muted">{subtitle}</p>
          ) : null}
        </div>
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-4 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
};

export { AuthShell };
