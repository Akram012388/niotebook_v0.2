"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { useHelpPulse } from "./useHelpPulse";
import type { HelpEntry } from "./helpEntries";

// ---------------------------------------------------------------------------
// Lazy-load the modal (no SSR — uses createPortal)
// ---------------------------------------------------------------------------

const HelpModal = dynamic(
  () => import("./HelpModal").then((m) => ({ default: m.HelpModal })),
  { ssr: false },
);

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface HelpContextValue {
  isOpen: boolean;
  openHelp: () => void;
  closeHelp: () => void;
  toggleHelp: () => void;
}

const HelpContext = createContext<HelpContextValue | null>(null);

function useHelp(): HelpContextValue {
  const ctx = useContext(HelpContext);
  if (!ctx) {
    throw new Error("useHelp must be used within a HelpProvider");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface HelpProviderProps {
  children: ReactNode;
}

const HelpProvider = ({ children }: HelpProviderProps): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const { triggerPulse } = useHelpPulse();

  const openHelp = useCallback(() => setIsOpen(true), []);
  const closeHelp = useCallback(() => setIsOpen(false), []);
  const toggleHelp = useCallback(() => setIsOpen((prev) => !prev), []);

  // Global keyboard shortcut: Cmd/Ctrl + /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // When a help card is clicked: close modal, wait for exit anim, then pulse
  const handleCardClick = useCallback(
    (entry: HelpEntry) => {
      setIsOpen(false);

      if (entry.targetSelector) {
        const selector = entry.targetSelector;
        window.setTimeout(() => {
          triggerPulse(selector);
        }, 200);
      }
    },
    [triggerPulse],
  );

  return (
    <HelpContext.Provider value={{ isOpen, openHelp, closeHelp, toggleHelp }}>
      {children}
      <HelpModal
        isOpen={isOpen}
        onClose={closeHelp}
        onCardClick={handleCardClick}
      />
    </HelpContext.Provider>
  );
};

export { HelpProvider, useHelp };
