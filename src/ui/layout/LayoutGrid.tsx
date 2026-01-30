import { Children, type ReactElement, type ReactNode } from "react";
import { type LayoutPreset, LAYOUT_PRESETS } from "./layoutTypes";

type LayoutGridProps = {
  preset: LayoutPreset;
  children: ReactNode;
};

const LayoutGrid = ({ preset, children }: LayoutGridProps): ReactElement => {
  const config = LAYOUT_PRESETS.find((item) => item.id === preset);
  const columns = config ? config.columns : LAYOUT_PRESETS[1].columns;
  const childArray = Children.toArray(children);

  return (
    <div
      className={`grid h-full min-h-0 ${columns}`}
      style={{ gridAutoRows: "minmax(0, 1fr)" }}
    >
      {childArray.map((child, index) => (
        <div
          key={index}
          className={`min-h-0 min-w-0${index < childArray.length - 1 ? " border-r border-border" : ""}`}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export { LayoutGrid };
