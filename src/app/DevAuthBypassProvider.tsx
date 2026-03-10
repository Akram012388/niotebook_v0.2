"use client";

import type { ReactNode } from "react";
import { DevAuthBypassContext } from "@/infra/dev/devAuthBypassContext";
import { DevAuthBypassEffect } from "./DevAuthBypassEffect";

type DevAuthBypassProviderProps = {
  bypassEnabled: boolean;
  children: ReactNode;
};

export function DevAuthBypassProvider({
  bypassEnabled,
  children,
}: DevAuthBypassProviderProps) {
  return (
    <DevAuthBypassContext value={bypassEnabled}>
      <DevAuthBypassEffect bypassEnabled={bypassEnabled} />
      {children}
    </DevAuthBypassContext>
  );
}
