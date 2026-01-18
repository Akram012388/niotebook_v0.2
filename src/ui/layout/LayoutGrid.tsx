import type { ReactElement, ReactNode } from "react";
import { type LayoutPreset, LAYOUT_PRESETS } from "./layoutTypes";

type LayoutGridProps = {
  preset: LayoutPreset;
  children: ReactNode;
};

const LayoutGrid = ({ preset, children }: LayoutGridProps): ReactElement => {
  const config = LAYOUT_PRESETS.find((item) => item.id === preset);
  const columns = config ? config.columns : LAYOUT_PRESETS[1].columns;

  return (
    <div
      className={`grid gap-6 ${columns}`}
      style={{ gridAutoRows: "minmax(160px, auto)" }}
    >
      {children}
    </div>
  );
};

export { LayoutGrid };
