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

const presetListeners = new Set<() => void>();
let presetSnapshot: LayoutPreset = "split";

const readPreset = (): LayoutPreset => {
  const stored = storageAdapter.getItem(STORAGE_KEY);

  if (stored === "single" || stored === "split" || stored === "triple") {
    return stored;
  }

  return "split";
};

const notifyPreset = (): void => {
  for (const listener of presetListeners) {
    listener();
  }
};

const hydratePreset = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.setTimeout(() => {
    const stored = readPreset();
    if (stored !== presetSnapshot) {
      presetSnapshot = stored;
      notifyPreset();
    }
  }, 0);
};

hydratePreset();

const LayoutPresetContext = createContext<LayoutPresetState | null>(null);

const LayoutPresetProvider = ({
  children,
}: {
  children: ReactNode;
}): ReactElement => {
  const subscribe = useCallback((onStoreChange: () => void): (() => void) => {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    presetListeners.add(onStoreChange);

    const handleStorage = (event: StorageEvent): void => {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      const stored = readPreset();
      if (stored !== presetSnapshot) {
        presetSnapshot = stored;
        notifyPreset();
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      presetListeners.delete(onStoreChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const activePreset = useSyncExternalStore<LayoutPreset>(
    subscribe,
    (): LayoutPreset => presetSnapshot,
    (): LayoutPreset => "split",
  );

  const setPreset = useCallback((preset: LayoutPreset): void => {
    presetSnapshot = preset;
    storageAdapter.setItem(STORAGE_KEY, preset);
    notifyPreset();
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
