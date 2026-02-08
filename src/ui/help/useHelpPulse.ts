import { useCallback } from "react";

/**
 * Returns a `triggerPulse` function that applies the ring-pulse animation
 * to a DOM element matched by `selector`.
 *
 * Adds the `data-help-pulse` attribute for 2.4 s (3 cycles × 0.8 s),
 * then cleans it up. No-ops silently if the element is not found.
 */
function useHelpPulse(): { triggerPulse: (selector: string) => void } {
  const triggerPulse = useCallback((selector: string) => {
    const el = document.querySelector(selector);
    if (!el) return;

    // Apply the attribute that activates the CSS animation
    requestAnimationFrame(() => {
      el.setAttribute("data-help-pulse", "");

      // Remove after 3 animation cycles (3 × 800ms = 2400ms)
      const timerId = window.setTimeout(() => {
        el.removeAttribute("data-help-pulse");
      }, 2400);

      // Cleanup safety: if the element is removed before the timer fires,
      // the attribute simply won't exist — no harm done.
      // Store timerId on the element for potential external cleanup.
      (el as HTMLElement).dataset.helpPulseTimer = String(timerId);
    });
  }, []);

  return { triggerPulse };
}

export { useHelpPulse };
