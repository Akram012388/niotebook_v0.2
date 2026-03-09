// Server Component — reads server-only env var and injects via context
import type { ReactNode } from "react";
import { DevAuthBypassContext } from "@/infra/devAuthBypassContext";
import { DevAuthBypassEffect } from "./DevAuthBypassEffect";

type DevAuthBypassProviderProps = {
  children: ReactNode;
};

export function DevAuthBypassProvider({
  children,
}: DevAuthBypassProviderProps) {
  const bypassEnabled = process.env.NIOTEBOOK_DEV_AUTH_BYPASS === "true";
  return (
    <DevAuthBypassContext value={bypassEnabled}>
      <DevAuthBypassEffect bypassEnabled={bypassEnabled} />
      {children}
    </DevAuthBypassContext>
  );
}
