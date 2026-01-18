type LayoutPreset = "single" | "split" | "triple";

type LayoutConfig = {
  id: LayoutPreset;
  label: string;
  columns: string;
};

const LAYOUT_PRESETS: LayoutConfig[] = [
  { id: "single", label: "1", columns: "grid-cols-1" },
  { id: "split", label: "2", columns: "grid-cols-[3fr_2fr]" },
  { id: "triple", label: "3", columns: "grid-cols-[2fr_1.5fr_1.5fr]" },
];

export type { LayoutPreset, LayoutConfig };
export { LAYOUT_PRESETS };
