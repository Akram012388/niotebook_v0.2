"use client";

import { type ReactElement, type ReactNode } from "react";

interface NotebookFrameProps {
  children: ReactNode;
  className?: string;
}

/*
 * Binder geometry (px).
 * Two close-together black vertical lines with tiny transparent
 * punch-holes centered in the gap. A narrow mask strip sits on top
 * of the rails: between holes it covers the rails (opaque surface),
 * at holes it is transparent, revealing the rails behind.
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
  const holeR = HOLE_D / 2;

  /* Mask for the narrow binder strip only.
     circle at 50% 50% — centered within the strip itself.
     Transparent inside the hole radius, opaque outside. */
  const stripMask = {
    WebkitMaskImage: `radial-gradient(circle at 50% 50%, transparent ${holeR}px, white ${holeR + 0.5}px)`,
    maskImage: `radial-gradient(circle at 50% 50%, transparent ${holeR}px, white ${holeR + 0.5}px)`,
    WebkitMaskSize: `100% ${HOLE_SPACING}px`,
    maskSize: `100% ${HOLE_SPACING}px`,
    WebkitMaskRepeat: "repeat-y",
    maskRepeat: "repeat-y",
  } as React.CSSProperties;

  /* Shared position for rails and mask strip — all use BINDER_LEFT inset */
  const binderInset = {
    left: BINDER_LEFT,
    top: BINDER_LEFT,
    bottom: BINDER_LEFT,
    width: containerW,
  };

  return (
    <div
      className={`relative rounded-2xl border border-border shadow-sm overflow-hidden bg-surface ${className}`}
    >
      {/* Layer 1 — Binder rails (z-0).
          Two true-black vertical lines. Top/bottom/left inset all equal
          BINDER_LEFT so the rails are visually balanced. */}
      <div
        className="absolute pointer-events-none"
        aria-hidden="true"
        style={{ ...binderInset, zIndex: 0 }}
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

      {/* Layer 2 — Mask strip (z-1).
          A narrow bg-surface strip positioned exactly over the binder
          column. The CSS mask punches transparent circles only within
          this strip, revealing the rails behind the holes. No holes
          leak into the padding area above/below the rails. */}
      <div
        className="absolute pointer-events-none bg-surface"
        aria-hidden="true"
        style={{ ...binderInset, ...stripMask, zIndex: 1 }}
      />

      {/* Layer 3 — Frame content (z-2).
          No background — the wrapper's bg-surface is the fill.
          Sits above both the rails and the mask strip. */}
      <div
        className="relative"
        style={{ zIndex: 2 }}
      >
        <div className="relative px-8 sm:px-12 md:px-16 py-10 sm:py-14">
          {children}
        </div>
      </div>
    </div>
  );
}
