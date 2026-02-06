"use client";

import { useEffect, useState, type ReactElement } from "react";

const BOOT_LINES = [
  "> initializing learning environment...",
  "> loading CS50 runtime...",
  "> connecting to niotebook...",
  "> ready.",
];

const LINE_DELAY_MS = 600;
const CHAR_DELAY_MS = 30;

const BootSequence = (): ReactElement => {
  const [visibleLines, setVisibleLines] = useState<string[]>(() => [
    BOOT_LINES[0].slice(0, 1),
  ]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(1);

  const isTyping = currentLineIndex < BOOT_LINES.length;

  useEffect(() => {
    if (!isTyping) {
      return;
    }

    const line = BOOT_LINES[currentLineIndex];

    if (currentCharIndex === 0 && currentLineIndex > 0) {
      const delayTimer = setTimeout(() => {
        setCurrentCharIndex(1);
      }, LINE_DELAY_MS);
      return () => clearTimeout(delayTimer);
    }

    if (currentCharIndex < line.length) {
      const charTimer = setTimeout(() => {
        setVisibleLines((prev) => {
          const next = [...prev];
          next[currentLineIndex] = line.slice(0, currentCharIndex + 1);
          return next;
        });
        setCurrentCharIndex((prev) => prev + 1);
      }, CHAR_DELAY_MS);
      return () => clearTimeout(charTimer);
    }

    const nextTimer = setTimeout(() => {
      setCurrentLineIndex((prev) => prev + 1);
      setCurrentCharIndex(0);
      setVisibleLines((prev) => {
        const next = [...prev];
        next[currentLineIndex] = line;
        return next;
      });
    }, LINE_DELAY_MS);
    return () => clearTimeout(nextTimer);
  }, [currentLineIndex, currentCharIndex, isTyping]);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-strong p-6 font-mono text-sm leading-relaxed text-accent shadow-lg">
      {visibleLines.map((line, index) => (
        <div key={index} className="flex">
          <span>{line}</span>
          {index === currentLineIndex && isTyping ? (
            <span className="ml-0.5 animate-pulse">_</span>
          ) : null}
        </div>
      ))}
      {!isTyping ? <span className="animate-pulse">_</span> : null}
    </div>
  );
};

export { BootSequence };
