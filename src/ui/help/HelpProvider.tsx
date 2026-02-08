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
import { useHelpSpotlight } from "./useHelpSpotlight";
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
  spotlightTarget: string | null;
  activateSpotlight: (selector: string) => void;
  dismissSpotlight: () => void;
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

  const closeHelp = useCallback(() => setIsOpen(false), []);
  const { spotlightTarget, activateSpotlight, dismissSpotlight } =
    useHelpSpotlight(closeHelp);

  const openHelp = useCallback(() => setIsOpen(true), []);

  const toggleHelp = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) {
        // Closing: also dismiss spotlight
        dismissSpotlight();
      }
      return !prev;
    });
  }, [dismissSpotlight]);

  // Global keyboard shortcut: Cmd/Ctrl + /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setIsOpen((prev) => {
          if (prev) {
            dismissSpotlight();
          }
          return !prev;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dismissSpotlight]);

  // When a help row is clicked: activate spotlight (modal stays open but blurs)
  const handleRowClick = useCallback(
    (entry: HelpEntry) => {
      if (entry.targetSelector) {
        activateSpotlight(entry.targetSelector);
      }
      // Entries without targetSelector (like "Help" itself) are no-ops
    },
    [activateSpotlight],
  );

  return (
    <HelpContext.Provider
      value={{
        isOpen,
        openHelp,
        closeHelp,
        toggleHelp,
        spotlightTarget,
        activateSpotlight,
        dismissSpotlight,
      }}
    >
      {children}
      <HelpModal
        isOpen={isOpen}
        onClose={closeHelp}
        onRowClick={handleRowClick}
      />
    </HelpContext.Provider>
  );
};

export { HelpProvider, useHelp };
