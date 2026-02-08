"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { useHelp } from "./HelpProvider";
import { TOUR_STEPS } from "./tourSteps";

// ---------------------------------------------------------------------------
// Tooltip position — anchored below (or above) the target element
// ---------------------------------------------------------------------------

interface TooltipPos {
  top: number;
  left: number;
}

function computePosition(target: Element): TooltipPos {
  const rect = target.getBoundingClientRect();
  const gap = 8;
  const tooltipHeight = 60;

  if (rect.bottom + gap + tooltipHeight < window.innerHeight) {
    return { top: rect.bottom + gap, left: rect.left + rect.width / 2 };
  }
  return { top: rect.top - gap - tooltipHeight, left: rect.left + rect.width / 2 };
}

// ---------------------------------------------------------------------------
// Progress dots
// ---------------------------------------------------------------------------

function ProgressDots({ current, total }: { current: number; total: number }): ReactElement {
  return (
    <span className="flex items-center gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            i <= current
              ? "bg-foreground"
              : "border border-text-muted bg-transparent"
          }`}
        />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Lightweight external store for tooltip position
// Avoids setState-in-effect lint violations by externalizing the position.
// ---------------------------------------------------------------------------

const _listeners = new Set<() => void>();
let _snapshot: TooltipPos | null = null;
const _serverSnapshot: TooltipPos | null = null;

function setTourPos(p: TooltipPos | null): void {
  _snapshot = p;
  _listeners.forEach((l) => l());
}

function subscribeTourPos(cb: () => void): () => void {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

function getSnapshot(): TooltipPos | null {
  return _snapshot;
}

function getServerSnapshot(): TooltipPos | null {
  return _serverSnapshot;
}

// ---------------------------------------------------------------------------
// HelpTour
// ---------------------------------------------------------------------------

const HelpTour = (): ReactElement | null => {
  const { isActive, step, totalSteps, advance, end } = useHelp();
  const prevTargetRef = useRef<Element | null>(null);
  const advanceDebounceRef = useRef(false);

  const pos = useSyncExternalStore(subscribeTourPos, getSnapshot, getServerSnapshot);
  const currentStep = TOUR_STEPS[step];

  // Apply spotlight when tour activates or step changes
  useEffect(() => {
    if (!isActive) return;

    // Remove spotlight from previous target
    if (prevTargetRef.current) {
      prevTargetRef.current.removeAttribute("data-help-spotlight");
    }

    const entry = TOUR_STEPS[step];
    if (!entry) return;

    const target = document.querySelector(entry.targetSelector);
    if (!target) {
      // Target not in DOM — skip
      if (step < TOUR_STEPS.length - 1) {
        advance();
      } else {
        end();
      }
      return;
    }

    target.setAttribute("data-help-spotlight", "");
    prevTargetRef.current = target;
    setTourPos(computePosition(target));
  }, [isActive, step, advance, end]);

  // Clean up spotlight attribute when tour ends
  useEffect(() => {
    if (isActive) return;

    if (prevTargetRef.current) {
      prevTargetRef.current.removeAttribute("data-help-spotlight");
      prevTargetRef.current = null;
    }
    setTourPos(null);

    // Restore focus to ? button
    const btn = document.querySelector('[data-help-target="help"]');
    if (btn instanceof HTMLElement) btn.focus();
  }, [isActive]);

  // Recalculate position on resize
  useEffect(() => {
    if (!isActive) return;

    let timeout: ReturnType<typeof setTimeout>;
    const onResize = (): void => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (prevTargetRef.current) {
          setTourPos(computePosition(prevTargetRef.current));
        }
      }, 100);
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(timeout);
    };
  }, [isActive]);

  // Handle clicking the spotlight target — activate tool + advance
  useEffect(() => {
    if (!isActive || !prevTargetRef.current) return;

    const target = prevTargetRef.current;

    const handleTargetClick = (e: Event): void => {
      if (advanceDebounceRef.current) return;
      advanceDebounceRef.current = true;
      setTimeout(() => {
        advanceDebounceRef.current = false;
      }, 100);

      e.stopPropagation();

      requestAnimationFrame(() => {
        target.removeAttribute("data-help-spotlight");
        (target as HTMLElement).click();
        advance();
      });
    };

    target.addEventListener("click", handleTargetClick, { capture: true });
    return () =>
      target.removeEventListener("click", handleTargetClick, { capture: true });
  }, [isActive, step, advance]);

  // Esc to end tour
  useEffect(() => {
    if (!isActive) return;

    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        end();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isActive, end]);

  if (!isActive) return null;

  return createPortal(
    <>
      {/* Dim overlay */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 transition-opacity duration-200 dark:bg-black/60"
        onClick={end}
        aria-hidden="true"
      />

      {/* Tooltip */}
      {pos && currentStep && (
        <div
          role="tooltip"
          aria-live="polite"
          className="pointer-events-none fixed z-[71] -translate-x-1/2 rounded-lg border border-border bg-surface px-3 py-2 shadow-lg transition-all duration-150"
          style={{ top: pos.top, left: pos.left }}
        >
          <div className="flex items-center gap-3">
            <span className="whitespace-nowrap text-sm font-medium text-foreground">
              {currentStep.name}
            </span>
            {currentStep.shortcut && (
              <span className="whitespace-nowrap font-mono text-xs text-text-muted">
                {currentStep.shortcut}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex justify-end">
            <ProgressDots current={step} total={totalSteps} />
          </div>
        </div>
      )}
    </>,
    document.body,
  );
};

export { HelpTour };
