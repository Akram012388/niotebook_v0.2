"use client";

import { useEffect, useRef, useCallback, useSyncExternalStore, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { useHelp } from "./HelpProvider";
import { TOUR_STEPS } from "./tourSteps";

// ---------------------------------------------------------------------------
// Position layout — tooltip + spotlight hole over the target
// ---------------------------------------------------------------------------

const SPOT_PAD = 6;

interface Layout {
  tipTop: number;
  tipLeft: number;
  spotTop: number;
  spotLeft: number;
  spotWidth: number;
  spotHeight: number;
}

function computeLayout(rect: DOMRect): Layout {
  const gap = 8;
  const tooltipHeight = 60;
  const tipLeft = rect.left + rect.width / 2;
  const tipTop =
    rect.bottom + gap + tooltipHeight < window.innerHeight
      ? rect.bottom + gap
      : rect.top - gap - tooltipHeight;

  return {
    tipTop,
    tipLeft,
    spotTop: rect.top - SPOT_PAD,
    spotLeft: rect.left - SPOT_PAD,
    spotWidth: rect.width + SPOT_PAD * 2,
    spotHeight: rect.height + SPOT_PAD * 2,
  };
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
// External store for layout (avoids setState-in-effect lint violations)
// ---------------------------------------------------------------------------

const _listeners = new Set<() => void>();
let _snapshot: Layout | null = null;
const _serverSnapshot: Layout | null = null;

function setLayout(l: Layout | null): void {
  _snapshot = l;
  _listeners.forEach((fn) => fn());
}

function subscribe(cb: () => void): () => void {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

function getSnap(): Layout | null {
  return _snapshot;
}

function getServerSnap(): Layout | null {
  return _serverSnapshot;
}

// ---------------------------------------------------------------------------
// HelpTour
// ---------------------------------------------------------------------------

const HelpTour = (): ReactElement | null => {
  const { isActive, step, totalSteps, advance, end } = useHelp();
  const prevTargetRef = useRef<Element | null>(null);
  const layout = useSyncExternalStore(subscribe, getSnap, getServerSnap);
  const currentStep = TOUR_STEPS[step];

  // Apply spotlight when tour activates or step changes
  useEffect(() => {
    if (!isActive) return;

    if (prevTargetRef.current) {
      prevTargetRef.current.removeAttribute("data-help-spotlight");
    }

    const entry = TOUR_STEPS[step];
    if (!entry) return;

    const target = document.querySelector(entry.targetSelector);
    if (!target) {
      if (step < TOUR_STEPS.length - 1) advance();
      else end();
      return;
    }

    target.setAttribute("data-help-spotlight", "");
    prevTargetRef.current = target;
    setLayout(computeLayout(target.getBoundingClientRect()));
  }, [isActive, step, advance, end]);

  // Clean up when tour ends
  useEffect(() => {
    if (isActive) return;

    if (prevTargetRef.current) {
      prevTargetRef.current.removeAttribute("data-help-spotlight");
      prevTargetRef.current = null;
    }
    setLayout(null);

    const btn = document.querySelector('[data-help-target="help"]');
    if (btn instanceof HTMLElement) btn.focus();
  }, [isActive]);

  // Recalculate on resize
  useEffect(() => {
    if (!isActive) return;

    let timeout: ReturnType<typeof setTimeout>;
    const onResize = (): void => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (prevTargetRef.current) {
          setLayout(computeLayout(prevTargetRef.current.getBoundingClientRect()));
        }
      }, 100);
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(timeout);
    };
  }, [isActive]);

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

  // Click the spotlight hole → activate the target tool + advance
  const handleSpotClick = useCallback(() => {
    const target = prevTargetRef.current;
    if (target) {
      target.removeAttribute("data-help-spotlight");
      (target as HTMLElement).click();
    }
    advance();
  }, [advance]);

  if (!isActive || !layout) return null;

  return createPortal(
    <>
      {/* Transparent backdrop — click outside spotlight to dismiss */}
      <div className="fixed inset-0 z-[59]" onClick={end} aria-hidden="true" />

      {/* Spotlight hole — box-shadow dims everything except the target area */}
      <div
        className="fixed z-[60] cursor-pointer rounded-xl"
        style={{
          top: layout.spotTop,
          left: layout.spotLeft,
          width: layout.spotWidth,
          height: layout.spotHeight,
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
        }}
        onClick={handleSpotClick}
        aria-hidden="true"
      />

      {/* Tooltip */}
      {currentStep && (
        <div
          role="tooltip"
          aria-live="polite"
          className="pointer-events-none fixed z-[61] -translate-x-1/2 rounded-lg border border-border bg-surface px-3 py-2 shadow-lg transition-all duration-150"
          style={{ top: layout.tipTop, left: layout.tipLeft }}
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
