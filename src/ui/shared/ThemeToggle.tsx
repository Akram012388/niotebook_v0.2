"use client";

import { useCallback, useEffect, useState, type ReactElement } from "react";
import { storageAdapter } from "@/infra/storageAdapter";

const THEME_KEY = "niotebook.theme";

type ThemeOption = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredOption(): ThemeOption {
  const stored = storageAdapter.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "system";
}

function applyOption(option: ThemeOption): void {
  const resolved = option === "system" ? getSystemTheme() : option;
  document.documentElement.setAttribute("data-theme", resolved);
  if (option === "system") {
    storageAdapter.removeItem(THEME_KEY);
  } else {
    storageAdapter.setItem(THEME_KEY, option);
  }
}

const options: { id: ThemeOption; label: string; icon: ReactElement }[] = [
  {
    id: "system",
    label: "System",
    icon: (
      <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
        <rect
          x="2"
          y="3"
          width="12"
          height="9"
          rx="1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <line
          x1="5"
          y1="14"
          x2="11"
          y2="14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "light",
    label: "Light",
    icon: (
      <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
        <circle
          cx="8"
          cy="8"
          r="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="8" y1="1.5" x2="8" y2="3" />
          <line x1="8" y1="13" x2="8" y2="14.5" />
          <line x1="1.5" y1="8" x2="3" y2="8" />
          <line x1="13" y1="8" x2="14.5" y2="8" />
          <line x1="3.4" y1="3.4" x2="4.5" y2="4.5" />
          <line x1="11.5" y1="11.5" x2="12.6" y2="12.6" />
          <line x1="3.4" y1="12.6" x2="4.5" y2="11.5" />
          <line x1="11.5" y1="4.5" x2="12.6" y2="3.4" />
        </g>
      </svg>
    ),
  },
  {
    id: "dark",
    label: "Dark",
    icon: (
      <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
        <path
          d="M13.5 9.5a5.5 5.5 0 01-7-7 5.5 5.5 0 107 7z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export function ThemeToggle(): ReactElement {
  const [active, setActive] = useState<ThemeOption>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setActive(getStoredOption());
      setMounted(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (): void => {
      if (getStoredOption() === "system") applyOption("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleSelect = useCallback((option: ThemeOption) => {
    setActive(option);
    applyOption(option);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 rounded-full border border-border bg-surface-muted p-1">
        {options.map((opt) => (
          <div key={opt.id} className="h-7 w-7 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-border bg-surface-muted p-1 text-text-muted"
      role="radiogroup"
      aria-label="Theme preference"
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="radio"
          aria-checked={active === opt.id}
          className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
            active === opt.id
              ? "bg-surface text-foreground shadow-sm"
              : "text-text-muted hover:bg-surface hover:text-foreground"
          }`}
          onClick={() => handleSelect(opt.id)}
          aria-label={opt.label}
          title={opt.label}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}
