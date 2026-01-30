/**
 * SplitPane — generic resizable split container.
 *
 * Uses CSS grid with `fr` units for the two panes separated by a 4px divider.
 * Desktop-only: mouse events for drag, no touch handling.
 */
import { useCallback, type ReactElement, type ReactNode } from "react";
import { SplitDivider } from "./SplitDivider";
import { useSplitPane } from "./useSplitPane";

type SplitPaneProps = {
  direction: "horizontal" | "vertical";
  initialSplit: number;
  minFirst: number;
  minSecond: number;
  storageKey?: string;
  first: ReactNode;
  second: ReactNode;
};

const SplitPane = ({
  direction,
  initialSplit,
  minFirst,
  minSecond,
  storageKey,
  first,
  second,
}: SplitPaneProps): ReactElement => {
  const { ratio, isDragging, handleMouseDown, handleDoubleClick, keyStep } =
    useSplitPane({
      direction,
      initialSplit,
      minFirst,
      minSecond,
      storageKey,
    });

  const isVertical = direction === "vertical";

  const handleKeyStep = useCallback(
    (delta: number) => {
      keyStep(delta);
    },
    [keyStep],
  );

  const gridTemplate = isVertical
    ? `${ratio}fr 4px ${1 - ratio}fr`
    : `${ratio}fr 4px ${1 - ratio}fr`;

  const gridStyle = isVertical
    ? { gridTemplateRows: gridTemplate }
    : { gridTemplateColumns: gridTemplate };

  return (
    <div
      className={`grid min-h-0 min-w-0 flex-1 ${isDragging ? "select-none" : ""}`}
      style={gridStyle}
    >
      <div
        className="min-h-0 min-w-0 overflow-hidden"
        style={isDragging ? { pointerEvents: "none" } : undefined}
      >
        {first}
      </div>
      <SplitDivider
        direction={direction}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onKeyStep={handleKeyStep}
        ratio={ratio}
      />
      <div
        className="min-h-0 min-w-0 overflow-hidden"
        style={isDragging ? { pointerEvents: "none" } : undefined}
      >
        {second}
      </div>
    </div>
  );
};

export { SplitPane };
export type { SplitPaneProps };
