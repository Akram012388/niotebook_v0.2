"use client";

import { memo, useCallback, useRef, type ReactElement } from "react";

interface NiotepadResizeHandleProps {
  onResize: (deltaX: number, deltaY: number) => void;
  onResizeEnd: () => void;
}

const MIN_WIDTH = 320;
const MIN_HEIGHT = 360;
const MAX_WIDTH = 640;
const MAX_HEIGHT = 800;

const NiotepadResizeHandle = memo(function NiotepadResizeHandle({
  onResize,
  onResizeEnd,
}: NiotepadResizeHandleProps): ReactElement {
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startRef.current = { x: e.clientX, y: e.clientY };
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);

      const handleMove = (ev: PointerEvent): void => {
        if (!startRef.current) return;
        const dx = ev.clientX - startRef.current.x;
        const dy = ev.clientY - startRef.current.y;
        startRef.current = { x: ev.clientX, y: ev.clientY };
        onResize(dx, dy);
      };

      const handleUp = (): void => {
        startRef.current = null;
        target.removeEventListener("pointermove", handleMove);
        target.removeEventListener("pointerup", handleUp);
        onResizeEnd();
      };

      target.addEventListener("pointermove", handleMove);
      target.addEventListener("pointerup", handleUp);
    },
    [onResize, onResizeEnd],
  );

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize niotepad panel"
      aria-valuenow={0}
      className="absolute bottom-0 right-0 z-10 flex h-4 w-4 cursor-nwse-resize items-end justify-end p-0.5"
      onPointerDown={handlePointerDown}
    >
      {/* 3-line diagonal grip */}
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        style={{ color: "var(--niotepad-text-subtle)" }}
      >
        <line
          x1="9"
          y1="1"
          x2="1"
          y2="9"
          stroke="currentColor"
          strokeWidth="1"
        />
        <line
          x1="9"
          y1="4"
          x2="4"
          y2="9"
          stroke="currentColor"
          strokeWidth="1"
        />
        <line
          x1="9"
          y1="7"
          x2="7"
          y2="9"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
});

export { NiotepadResizeHandle, MIN_WIDTH, MIN_HEIGHT, MAX_WIDTH, MAX_HEIGHT };
