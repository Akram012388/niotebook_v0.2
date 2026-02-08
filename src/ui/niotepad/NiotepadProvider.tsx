"use client";

import { useEffect, type ReactElement, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useNiotepadStore } from "@/infra/niotepad/useNiotepadStore";

const NiotepadPortal = dynamic(
  () => import("./NiotepadPortal").then((m) => ({ default: m.NiotepadPortal })),
  { ssr: false },
);

interface NiotepadProviderProps {
  children: ReactNode;
}

const NiotepadProvider = ({
  children,
}: NiotepadProviderProps): ReactElement => {
  const togglePanel = useNiotepadStore((s) => s.togglePanel);
  const loadFromStorage = useNiotepadStore((s) => s.loadFromStorage);
  const isLoaded = useNiotepadStore((s) => s.isLoaded);

  // Load persisted data on mount
  useEffect(() => {
    if (!isLoaded) {
      void loadFromStorage();
    }
  }, [isLoaded, loadFromStorage]);

  // Global keyboard shortcut: Cmd/Ctrl+J
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        togglePanel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePanel]);

  return (
    <>
      {children}
      <NiotepadPortal />
    </>
  );
};

export { NiotepadProvider };
