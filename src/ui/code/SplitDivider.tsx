/**
 * SplitDivider — accessible drag handle for SplitPane.
 *
 * - `role="separator"` with `aria-orientation`
 * - Keyboard arrow support (Up/Down for vertical, Left/Right for horizontal)
 * - Double-click to reset
 * - 4px visible divider with 1px border line (VS Code style)
 */
import { useCallback, type ReactElement } from "react";

type SplitDividerProps = {
  direction: "horizontal" | "vertical";
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onKeyStep: (delta: number) => void;
  ratio: number;
};

const STEP = 0.02;

const SplitDivider = ({
  direction,
  onMouseDown,
  onDoubleClick,
  onKeyStep,
  ratio,
}: SplitDividerProps): ReactElement => {
  const isVertical = direction === "vertical";

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isVertical) {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          onKeyStep(-STEP);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          onKeyStep(STEP);
        }
      } else {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          onKeyStep(-STEP);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          onKeyStep(STEP);
        }
      }
    },
    [isVertical, onKeyStep],
  );

  return (
    <div
      role="separator"
      aria-orientation={isVertical ? "horizontal" : "vertical"}
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Resize panes"
      tabIndex={0}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      onKeyDown={handleKeyDown}
      className={`
        relative flex items-center justify-center
        ${isVertical ? "h-1 cursor-row-resize border-t border-workspace-border" : "w-1 cursor-col-resize border-l border-workspace-border"}
        bg-workspace-editor transition-colors hover:bg-workspace-accent-muted focus-visible:bg-workspace-accent-muted
        focus-visible:outline-none
      `}
    >
      {/* Grip dots */}
      <div
        className={`flex gap-px opacity-40 ${isVertical ? "flex-row" : "flex-col"}`}
      >
        <span className="block h-0.5 w-0.5 rounded-full bg-workspace-text-muted" />
        <span className="block h-0.5 w-0.5 rounded-full bg-workspace-text-muted" />
        <span className="block h-0.5 w-0.5 rounded-full bg-workspace-text-muted" />
      </div>
    </div>
  );
};

export { SplitDivider };
export type { SplitDividerProps };
