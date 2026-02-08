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
import { TOUR_STEPS } from "./tourSteps";

const HelpTour = dynamic(
  () => import("./HelpTour").then((m) => ({ default: m.HelpTour })),
  { ssr: false },
);

interface HelpContextValue {
  isActive: boolean;
  step: number;
  totalSteps: number;
  start: () => void;
  advance: () => void;
  end: () => void;
}

const HelpContext = createContext<HelpContextValue | null>(null);

function useHelp(): HelpContextValue {
  const ctx = useContext(HelpContext);
  if (!ctx) throw new Error("useHelp must be used within a HelpProvider");
  return ctx;
}

const HelpProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [isActive, setIsActive] = useState(false);
  const [step, setStep] = useState(0);

  const end = useCallback(() => {
    setIsActive(false);
    setStep(0);
  }, []);

  const start = useCallback(() => {
    setStep(0);
    setIsActive(true);
  }, []);

  const advance = useCallback(() => {
    setStep((prev) => {
      const next = prev + 1;
      // If we've gone past the last step, end the tour
      if (next >= TOUR_STEPS.length) {
        setIsActive(false);
        return 0;
      }
      return next;
    });
  }, []);

  // Global keyboard shortcut: Cmd/Ctrl + /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setIsActive((prev) => {
          if (prev) {
            setStep(0);
            return false;
          }
          setStep(0);
          return true;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <HelpContext.Provider
      value={{
        isActive,
        step,
        totalSteps: TOUR_STEPS.length,
        start,
        advance,
        end,
      }}
    >
      {children}
      <HelpTour />
    </HelpContext.Provider>
  );
};

export { HelpProvider, useHelp };
