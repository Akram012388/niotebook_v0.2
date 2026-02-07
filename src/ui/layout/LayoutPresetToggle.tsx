"use client";

import type { ReactElement } from "react";
import { useLayoutPreset } from "./LayoutPresetContext";

const LayoutPresetToggle = (): ReactElement => {
  const { activePreset, setPreset, presets } = useLayoutPreset();

  const iconMap: Record<string, ReactElement> = {
    single: (
      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
        <rect
          x="3"
          y="5"
          width="14"
          height="10"
          rx="2"
          className="fill-current"
        />
      </svg>
    ),
    split: (
      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
        <rect
          x="2.5"
          y="5"
          width="7"
          height="10"
          rx="2"
          className="fill-current"
        />
        <rect
          x="10.5"
          y="5"
          width="7"
          height="10"
          rx="2"
          className="fill-current"
        />
      </svg>
    ),
    triple: (
      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
        <rect
          x="2"
          y="5"
          width="5"
          height="10"
          rx="2"
          className="fill-current"
        />
        <rect
          x="7.5"
          y="5"
          width="5"
          height="10"
          rx="2"
          className="fill-current"
        />
        <rect
          x="13"
          y="5"
          width="5"
          height="10"
          rx="2"
          className="fill-current"
        />
      </svg>
    ),
  };

  const labelMap: Record<string, string> = {
    single: "1-col",
    split: "2-col",
    triple: "3-col",
  };

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-surface-muted p-1 text-text-muted">
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          data-testid="layout-toggle"
          className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
            activePreset === preset.id
              ? "bg-accent text-white shadow-sm"
              : "text-text-muted hover:bg-surface hover:text-foreground"
          }`}
          onClick={() => setPreset(preset.id)}
          aria-label={labelMap[preset.id] ?? `${preset.label}-col`}
          title={labelMap[preset.id] ?? `${preset.label}-col`}
        >
          {iconMap[preset.id] ?? preset.label}
        </button>
      ))}
    </div>
  );
};

export { LayoutPresetToggle };
