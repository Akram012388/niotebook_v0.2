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

  const subscribe = useCallback((onStoreChange: () => void): (() => void) => {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    const handleStorage = (event: StorageEvent): void => {
      if (event.key === STORAGE_KEY) {
        onStoreChange();
      }
    };

    const handleCustom = (): void => {
      onStoreChange();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("niotebook:layout", handleCustom);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("niotebook:layout", handleCustom);
    };
  }, []);

  const activePreset = useSyncExternalStore<LayoutPreset>(
    subscribe,
    getSnapshot,
    (): LayoutPreset => "split",
  );

  const setPreset = useCallback((preset: LayoutPreset): void => {
    storageAdapter.setItem(STORAGE_KEY, preset);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("niotebook:layout"));
    }
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
