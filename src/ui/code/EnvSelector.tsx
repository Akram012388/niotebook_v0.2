"use client";

/**
 * EnvSelector — debug-only dropdown to switch environment presets.
 *
 * Only rendered when `process.env.NODE_ENV === 'development'`.
 * Allows developers to quickly switch between CS50 presets for testing.
 */
import { useCallback, type ReactElement } from "react";
import { ENV_PRESETS, getPreset } from "../../infra/runtime/envPresets";
import type { EnvPresetId, LessonEnvironment } from "../../domain/lessonEnvironment";

type EnvSelectorProps = {
  currentPresetId: EnvPresetId;
  onSelect: (env: LessonEnvironment) => void;
};

const PRESET_IDS = Object.keys(ENV_PRESETS) as EnvPresetId[];

const EnvSelectorInner = ({
  currentPresetId,
  onSelect,
}: EnvSelectorProps): ReactElement => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value as EnvPresetId;
      onSelect(getPreset(id));
    },
    [onSelect],
  );

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-amber-500 font-mono text-[10px]">DEV</span>
      <select
        value={currentPresetId}
        onChange={handleChange}
        className="rounded border border-border bg-surface px-1.5 py-0.5 text-xs text-foreground"
        aria-label="Environment preset"
      >
        {PRESET_IDS.map((id) => (
          <option key={id} value={id}>
            {ENV_PRESETS[id].name}
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * Only renders in development mode. Returns null in production.
 */
const EnvSelector = (props: EnvSelectorProps): ReactElement | null => {
  if (process.env.NODE_ENV !== "development") return null;
  return <EnvSelectorInner {...props} />;
};

export { EnvSelector };
export type { EnvSelectorProps };
