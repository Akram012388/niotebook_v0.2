"use client";

import { useEffect } from "react";

/**
 * Client component that forces a specific theme on mount
 * and restores the previous theme on unmount.
 */
export function ForceTheme({ theme }: { theme: "light" | "dark" }): null {
  useEffect(() => {
    const prev = document.documentElement.dataset.theme;
    document.documentElement.dataset.theme = theme;
    return () => {
      if (prev) {
        document.documentElement.dataset.theme = prev;
      } else {
        delete document.documentElement.dataset.theme;
      }
    };
  }, [theme]);

  return null;
}
