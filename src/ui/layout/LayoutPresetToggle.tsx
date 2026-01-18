"use client";

import type { ReactElement } from "react";
import { useLayoutPreset } from "./LayoutPresetContext";

const LayoutPresetToggle = (): ReactElement => {
  const { activePreset, setPreset, presets } = useLayoutPreset();

  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-medium text-slate-600">
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className={`rounded-full px-2.5 py-1 ${
            activePreset === preset.id
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600"
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
