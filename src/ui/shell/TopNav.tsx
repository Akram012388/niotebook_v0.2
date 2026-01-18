"use client";

import { useCallback, useEffect, useState, type ReactElement } from "react";
import { LayoutPresetToggle } from "../layout/LayoutPresetToggle";

const STORAGE_KEY = "niotebook.theme";

type ThemeMode = "light" | "dark";

const TopNav = (): ReactElement => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "dark" ? "dark" : "light";
  });

  useEffect((): void => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const handleToggleTheme = useCallback((): void => {
    setTheme((prev) => {
      const nextTheme: ThemeMode = prev === "light" ? "dark" : "light";
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
      return nextTheme;
    });
  }, []);

  const handleShare = useCallback((): void => {
    // Placeholder for share modal trigger.
  }, []);

  const handleFeedback = useCallback((): void => {
    // Placeholder for feedback modal trigger.
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold tracking-tight text-slate-900">
            Niotebook
          </span>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
          >
            CS50x / Week 1
          </button>
        </div>
        <div className="flex items-center gap-3">
          <LayoutPresetToggle />
          <button
            type="button"
            onClick={handleShare}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700"
            aria-label="Share"
          >
            Share
          </button>
          <button
            type="button"
            onClick={handleFeedback}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700"
            aria-label="Feedback"
          >
            Feedback
          </button>
          <button
            type="button"
            onClick={handleToggleTheme}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700"
            aria-label="Toggle theme"
          >
            {theme === "light" ? "Light" : "Dark"}
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700"
          >
            User
          </button>
        </div>
      </div>
    </header>
  );
};

export { TopNav };
