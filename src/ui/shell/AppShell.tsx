"use client";

import { Suspense, useMemo, type ReactElement, type ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  LayoutPresetProvider,
  useLayoutPreset,
} from "../layout/LayoutPresetContext";
import { useDevAuthBypass } from "@/infra/dev/devAuthBypassContext";
import { TopNav } from "./TopNav";
import { NiotepadProvider } from "../niotepad/NiotepadProvider";

// Lazy-load the Clerk bridge to avoid pulling @clerk/nextjs when bypass is active.
const TopNavClerkBridge = dynamic(() => import("./TopNavClerkBridge"));

type AppShellProps = {
  children: ReactNode;
};

const AppShellFrame = ({ children }: AppShellProps): ReactElement => {
  const { activePreset } = useLayoutPreset();
  const isDevBypass = useDevAuthBypass();

  const mainClass = useMemo(() => {
    if (activePreset === "single") {
      return "flex w-full flex-1 flex-col overflow-hidden";
    }
    return "flex w-full flex-1 flex-col overflow-hidden";
  }, [activePreset]);

  const navFallback = (
    <div className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-3">
        <span className="font-display text-sm font-semibold tracking-tight text-foreground">
          niotebook
        </span>
      </div>
    </div>
  );

  return (
    <div className="relative z-[2] flex h-screen flex-col bg-background text-foreground">
      <Suspense fallback={navFallback}>
        {isDevBypass ? <TopNav /> : <TopNavClerkBridge />}
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
