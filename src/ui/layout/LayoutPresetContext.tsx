"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from "react";
import { storageAdapter } from "../../infra/storageAdapter";
import { LAYOUT_PRESETS, type LayoutPreset } from "./layoutTypes";

type LayoutPresetState = {
  activePreset: LayoutPreset;
  setPreset: (preset: LayoutPreset) => void;
  presets: typeof LAYOUT_PRESETS;
};

const STORAGE_KEY = "niotebook.layout";

const LayoutPresetContext = createContext<LayoutPresetState | null>(null);

const LayoutPresetProvider = ({
  children,
}: {
  children: ReactNode;
}): ReactElement => {
  const getSnapshot = useCallback((): LayoutPreset => {
    const stored = storageAdapter.getItem(STORAGE_KEY);

    if (stored === "single" || stored === "split" || stored === "triple") {
      return stored;
    }

    return "split";
  }, []);

  const activePreset = useSyncExternalStore<LayoutPreset>(
    () => () => undefined,
    getSnapshot,
    (): LayoutPreset => "split",
  );

  const setPreset = useCallback((preset: LayoutPreset): void => {
    storageAdapter.setItem(STORAGE_KEY, preset);
  }, []);

  const value = useMemo(
    () => ({ activePreset, setPreset, presets: LAYOUT_PRESETS }),
    [activePreset, setPreset],
  );

  return (
    <LayoutPresetContext.Provider value={value}>
      {children}
    </LayoutPresetContext.Provider>
  );
};

const useLayoutPreset = (): LayoutPresetState => {
  const ctx = useContext(LayoutPresetContext);

  if (!ctx) {
    throw new Error("Layout preset context not initialized.");
  }

  return ctx;
};

export { LayoutPresetProvider, useLayoutPreset };
