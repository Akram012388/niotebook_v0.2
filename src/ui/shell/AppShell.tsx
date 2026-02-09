"use client";

import { Suspense, useMemo, type ReactElement, type ReactNode } from "react";
import {
  LayoutPresetProvider,
  useLayoutPreset,
} from "../layout/LayoutPresetContext";
import { TopNav } from "./TopNav";
import { NiotepadProvider } from "../niotepad/NiotepadProvider";

type AppShellProps = {
  children: ReactNode;
};

const AppShellFrame = ({ children }: AppShellProps): ReactElement => {
  const { activePreset } = useLayoutPreset();

  const mainClass = useMemo(() => {
    if (activePreset === "single") {
      return "flex w-full flex-1 flex-col overflow-hidden";
    }
    return "flex w-full flex-1 flex-col overflow-hidden";
  }, [activePreset]);

  return (
    <div className="relative z-[2] flex h-screen flex-col bg-background text-foreground">
      <Suspense
        fallback={
          <div className="border-b border-border bg-surface">
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-3">
              <span className="font-display text-sm font-semibold tracking-tight text-foreground">
                niotebook
              </span>
            </div>
          </div>
        }
      >
        <TopNav />
      </Suspense>
      <main className={mainClass}>{children}</main>
    </div>
  );
};

const AppShell = ({ children }: AppShellProps): ReactElement => {
  return (
    <LayoutPresetProvider>
      <NiotepadProvider>
        <AppShellFrame>{children}</AppShellFrame>
      </NiotepadProvider>
    </LayoutPresetProvider>
  );
};

export { AppShell };
