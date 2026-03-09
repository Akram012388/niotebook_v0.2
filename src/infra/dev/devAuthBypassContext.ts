"use client";
import { createContext, use } from "react";

export const DevAuthBypassContext = createContext(false);

export function useDevAuthBypass(): boolean {
  return use(DevAuthBypassContext);
}
