"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SpotlightState {
  /** CSS selector of the currently spotlighted element, or null */
  spotlightTarget: string | null;
  /** Activate spotlight on a target element */
  activateSpotlight: (selector: string) => void;
  /** Dismiss the current spotlight */
  dismissSpotlight: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

function useHelpSpotlight(onLaunchAndClose: () => void): SpotlightState {
  const [spotlightTarget, setSpotlightTarget] = useState<string | null>(null);
  const targetElRef = useRef<Element | null>(null);
  const targetClickHandlerRef = useRef<(() => void) | null>(null);
  const backdropClickHandlerRef = useRef<((e: MouseEvent) => void) | null>(
    null,
  );

  const cleanup = useCallback(() => {
    // Remove data attributes
    document.body.removeAttribute("data-help-spotlight-active");
    if (targetElRef.current) {
      targetElRef.current.removeAttribute("data-help-spotlight");
    }

    // Remove event listeners
    if (targetElRef.current && targetClickHandlerRef.current) {
      targetElRef.current.removeEventListener(
        "click",
        targetClickHandlerRef.current,
      );
    }
    if (backdropClickHandlerRef.current) {
      document.removeEventListener(
        "click",
        backdropClickHandlerRef.current,
        true,
      );
    }

    targetElRef.current = null;
    targetClickHandlerRef.current = null;
    backdropClickHandlerRef.current = null;
  }, []);

  const dismissSpotlight = useCallback(() => {
    cleanup();
    setSpotlightTarget(null);
  }, [cleanup]);

  const activateSpotlight = useCallback(
    (selector: string) => {
      // Clean up any existing spotlight first
      cleanup();

      const el = document.querySelector(selector);
      if (!el) return;

      targetElRef.current = el;
      setSpotlightTarget(selector);

      requestAnimationFrame(() => {
        // Set blur on workspace + help panel
        document.body.setAttribute("data-help-spotlight-active", "");
        // Set glow on target
        el.setAttribute("data-help-spotlight", "");

        // Click target → launch the tool + close help entirely
        const targetHandler = () => {
          cleanup();
          setSpotlightTarget(null);
          // Trigger the control's native click after a frame
          requestAnimationFrame(() => {
            (el as HTMLElement).click();
          });
          onLaunchAndClose();
        };
        targetClickHandlerRef.current = targetHandler;
        el.addEventListener("click", targetHandler, { once: true });

        // Click anywhere else → dismiss spotlight only (return to help list)
        const backdropHandler = (e: MouseEvent) => {
          if (el.contains(e.target as Node)) return;
          e.stopPropagation();
          e.preventDefault();
          cleanup();
          setSpotlightTarget(null);
          document.removeEventListener("click", backdropHandler, true);
        };
        backdropClickHandlerRef.current = backdropHandler;
        document.addEventListener("click", backdropHandler, true);
      });
    },
    [cleanup, onLaunchAndClose],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { spotlightTarget, activateSpotlight, dismissSpotlight };
}

export { useHelpSpotlight };
export type { SpotlightState };
