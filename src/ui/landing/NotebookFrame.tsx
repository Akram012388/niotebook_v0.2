"use client";

import { type ReactElement, type ReactNode } from "react";

interface NotebookFrameProps {
  children: ReactNode;
  className?: string;
}

/*
 * Binder geometry (px).
 * Two close-together black vertical lines with tiny transparent
 * punch-holes centered in the gap. Holes are truly transparent
 * (CSS mask), revealing the page background grid + rails behind.
 */
const RAIL_W = 2;
const RAIL_GAP = 2;
const BINDER_LEFT = 20;
const HOLE_D = 6;
const HOLE_SPACING = 12;

export function NotebookFrame({
  children,
  className = "",
}: NotebookFrameProps): ReactElement {
  const containerW = RAIL_W * 2 + RAIL_GAP;
  /* Hole center X — midpoint of the binder column, relative to the frame */
  const binderCx = BINDER_LEFT + containerW / 2;
  const holeR = HOLE_D / 2;
  /* Single-layer CSS mask: tiny transparent circles on an opaque field.
     The radial-gradient creates one circle per tile; mask-repeat tiles
     it vertically across the full frame height. */
  const maskStyle = {
    WebkitMaskImage: `radial-gradient(circle at ${binderCx}px 50%, transparent ${holeR}px, white ${holeR + 0.5}px)`,
    maskImage: `radial-gradient(circle at ${binderCx}px 50%, transparent ${holeR}px, white ${holeR + 0.5}px)`,
    WebkitMaskSize: `100% ${HOLE_SPACING}px`,
    maskSize: `100% ${HOLE_SPACING}px`,
    WebkitMaskRepeat: "repeat-y",
    maskRepeat: "repeat-y",
  } as React.CSSProperties;

  return (
    <div
      className={`relative rounded-2xl border border-border shadow-sm overflow-hidden ${className}`}
    >
      {/* Layer 1 — Binder rails behind the frame.
          True black. Top/bottom inset matches the content's left padding
          (px-8 / sm:px-12 / md:px-16) so the binder column is visually
          balanced with the content margins. */}
      <div
        className="absolute pointer-events-none top-8 bottom-8 sm:top-12 sm:bottom-12 md:top-16 md:bottom-16"
        aria-hidden="true"
        style={{
          left: BINDER_LEFT,
          width: containerW,
          zIndex: 0,
        }}
      >
        <div
          className="absolute inset-y-0"
          style={{ left: 0, width: RAIL_W, background: "#000" }}
        />
        <div
          className="absolute inset-y-0"
          style={{ right: 0, width: RAIL_W, background: "#000" }}
        />
      </div>

      {/* Layer 2 — Notebook page.
          Opaque bg-surface with a CSS mask that punches tiny
          transparent circles along the binder margin. The circles
          run the full height, revealing the rails + background grid. */}
      <div className="relative bg-surface" style={{ ...maskStyle, zIndex: 1 }}>
        <div className="relative px-8 sm:px-12 md:px-16 py-10 sm:py-14">
          {children}
        </div>
      </div>
    </div>
  );
}
