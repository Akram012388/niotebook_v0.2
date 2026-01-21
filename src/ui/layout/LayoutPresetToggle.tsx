"use client";

import type { ReactElement } from "react";
import { useLayoutPreset } from "./LayoutPresetContext";

const LayoutPresetToggle = (): ReactElement => {
  const { activePreset, setPreset, presets } = useLayoutPreset();

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-surface-muted p-1 text-xs font-medium text-text-muted">
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className={`rounded-full px-2.5 py-1 transition ${
            activePreset === preset.id
              ? "bg-surface text-foreground shadow-sm"
              : "text-text-muted hover:bg-surface hover:text-foreground"
          }`}
          onClick={() => setPreset(preset.id)}
          aria-label={`Switch to ${preset.label}-column layout`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
};

export { LayoutPresetToggle };
