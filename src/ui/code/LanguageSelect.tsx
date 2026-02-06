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
  sql: "SQL",
  r: "R",
};

const LANGUAGE_ORDER: RuntimeLanguage[] = ["js", "python", "c", "html", "css", "sql", "r"];

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
        event.key === "ArrowLeft"
      ) {
        event.preventDefault();
        setIsOpen(true);
      }
    },
    [],
  );

  const availableOptions = useMemo(
    () => orderedOptions.filter((language) => language !== value),
    [orderedOptions, value],
  );
  const hasOptions = availableOptions.length > 0;
  const isExpanded = isOpen && hasOptions;

  useEffect(() => {
    if (!isExpanded) return;

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
  }, [isExpanded]);

  return (
    <div ref={containerRef} className="relative text-xs">
      <div className="flex items-center rounded-full border border-border bg-surface-muted p-1">
        <div
          className={`flex items-center gap-1 overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform,margin] duration-200 ease-out ${
            isExpanded
              ? "mr-1 max-w-[240px] opacity-100 translate-x-0"
              : "mr-0 max-w-0 opacity-0 translate-x-2"
          }`}
          role="menu"
          aria-label="Select language"
        >
          {availableOptions.map((language) => (
            <button
              key={language}
              type="button"
              role="menuitem"
              onClick={() => handleSelect(language)}
              className="rounded-full px-2 py-1 text-[11px] text-text-muted transition hover:bg-surface hover:text-foreground"
            >
              {LANGUAGE_LABELS[language]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={hasOptions ? handleToggle : undefined}
          onKeyDown={hasOptions ? handleButtonKeyDown : undefined}
          aria-haspopup="menu"
          aria-expanded={isExpanded}
          className="rounded-full bg-surface px-2 py-1 text-[11px] text-foreground transition hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
        >
          {LANGUAGE_LABELS[value]}
        </button>
      </div>
    </div>
  );
};

export { LanguageSelect };
export type { LanguageSelectProps };
