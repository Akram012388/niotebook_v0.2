"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import type { RuntimeLanguage } from "../../infra/runtime/types";

type LanguageSelectProps = {
  value: RuntimeLanguage;
  options?: RuntimeLanguage[];
  onChange: (language: RuntimeLanguage) => void;
};

const LANGUAGE_LABELS: Record<RuntimeLanguage, string> = {
  js: "JS",
  python: "Python",
  c: "C",
  html: "HTML",
  css: "CSS",
};

const LANGUAGE_ORDER: RuntimeLanguage[] = ["js", "python", "c", "html", "css"];

const LanguageSelect = ({
  value,
  options,
  onChange,
}: LanguageSelectProps): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const orderedOptions = useMemo(() => {
    const base = options && options.length > 0 ? options : LANGUAGE_ORDER;
    const unique = Array.from(new Set(base));
    const ordered = LANGUAGE_ORDER.filter((lang) => unique.includes(lang));
    return ordered.length > 0 ? ordered : unique;
  }, [options]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleSelect = useCallback(
    (language: RuntimeLanguage) => {
      onChange(language);
      setIsOpen(false);
    },
    [onChange],
  );

  const handleButtonKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault();
        setIsOpen(true);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (event: MouseEvent): void => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative text-xs">
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleButtonKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-full border border-workspace-border bg-workspace-tabbar px-3 py-1 text-workspace-text transition hover:bg-workspace-editor focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-workspace-accent"
      >
        <span className="text-[11px] font-semibold tracking-wide">
          {LANGUAGE_LABELS[value]}
        </span>
        <span className="text-[10px] text-workspace-text-muted">▾</span>
      </button>
      {isOpen ? (
        <div
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 z-20 mt-2 w-36 rounded-md border border-workspace-border bg-workspace-sidebar p-1 shadow-lg"
        >
          {orderedOptions.map((language) => {
            const isActive = language === value;
            return (
              <button
                key={language}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(language)}
                className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition ${
                  isActive
                    ? "bg-workspace-editor text-workspace-text"
                    : "text-workspace-text-muted hover:bg-workspace-editor hover:text-workspace-text"
                }`}
              >
                <span className="font-medium">{LANGUAGE_LABELS[language]}</span>
                {isActive ? (
                  <span className="text-[10px] text-workspace-accent">●</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export { LanguageSelect };
export type { LanguageSelectProps };
