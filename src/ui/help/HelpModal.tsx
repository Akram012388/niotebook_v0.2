"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "@phosphor-icons/react";
import { HELP_ENTRIES, type HelpEntry } from "./helpEntries";
import { HelpCard } from "./HelpCard";
import { HelpSearch } from "./HelpSearch";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PANEL_SHADOW = [
  "0 0 0 1px color-mix(in srgb, var(--help-border) 60%, transparent)",
  "0 1px 2px 0 rgba(120, 90, 60, 0.08)",
  "0 4px 8px -2px rgba(120, 90, 60, 0.10)",
  "0 12px 24px -4px rgba(100, 75, 50, 0.12)",
  "0 32px 64px -8px rgba(80, 60, 40, 0.14)",
].join(", ");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCardClick: (entry: HelpEntry) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const HelpModal = ({
  isOpen,
  onClose,
  onCardClick,
}: HelpModalProps): ReactElement | null => {
  const prefersReducedMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);
  const [search, setSearch] = useState("");

  // Store previously focused element and autofocus search on open
  useEffect(() => {
    if (isOpen) {
      lastActiveRef.current = document.activeElement as HTMLElement | null;
      // Reset search and autofocus after animation settles
      const timer = window.setTimeout(() => {
        setSearch("");
        searchRef.current?.focus();
      }, 50);
      return () => window.clearTimeout(timer);
    } else {
      // Restore focus on close
      lastActiveRef.current?.focus();
      lastActiveRef.current = null;
    }
  }, [isOpen]);

  // Filter entries by search query
  const filtered = useMemo(() => {
    if (!search.trim()) return HELP_ENTRIES;
    const q = search.toLowerCase();
    return HELP_ENTRIES.filter((entry) => {
      if (entry.name.toLowerCase().includes(q)) return true;
      if (entry.description.toLowerCase().includes(q)) return true;
      if (
        entry.shortcuts?.some((s) => s.label.toLowerCase().includes(q))
      )
        return true;
      return false;
    });
  }, [search]);

  // Esc handling: clear search first, then close modal
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (search) {
          setSearch("");
        } else {
          onClose();
        }
        return;
      }

      // Focus trap: cycle Tab within the panel
      if (e.key === "Tab") {
        const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [search, onClose],
  );

  // Backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleCardClick = useCallback(
    (entry: HelpEntry) => {
      onCardClick(entry);
    },
    [onCardClick],
  );

  // Animation variants
  const panelTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { type: "spring" as const, stiffness: 400, damping: 28, mass: 0.8 };

  const backdropTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { duration: 0.2 };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={backdropTransition}
          onClick={handleBackdropClick}
          style={{
            backgroundColor: "var(--help-backdrop)",
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-modal-title"
            onKeyDown={handleKeyDown}
            className="help-scroll flex flex-col overflow-hidden outline-none"
            tabIndex={-1}
            style={{
              width: 560,
              maxWidth: "calc(100vw - 32px)",
              height: 640,
              maxHeight: "calc(100vh - 96px)",
              borderRadius: 16,
              background: "var(--help-panel-bg)",
              border: "1px solid var(--help-border)",
              boxShadow: PANEL_SHADOW,
            }}
            initial={
              prefersReducedMotion
                ? { opacity: 1 }
                : { scale: 0.95, opacity: 0 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { scale: 1, opacity: 1 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { scale: 0.97, opacity: 0 }
            }
            transition={panelTransition}
            // Override exit transition
            onAnimationComplete={() => {}}
          >
            {/* Header */}
            <div
              className="flex shrink-0 items-center justify-between border-b px-4 py-3"
              style={{
                background: "var(--help-header-bg)",
                borderColor: "var(--help-border)",
              }}
            >
              <h2
                id="help-modal-title"
                className="text-sm font-semibold"
                style={{ color: "var(--help-text-muted)" }}
              >
                Help
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                style={{ color: "var(--help-text-muted)" }}
                aria-label="Close help"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            {/* Search */}
            <HelpSearch ref={searchRef} value={search} onChange={setSearch} />

            {/* Card grid */}
            <div
              className="help-scroll flex-1 overflow-y-auto p-4"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 12,
                alignContent: "start",
              }}
            >
              {filtered.map((entry) => (
                <HelpCard
                  key={entry.id}
                  entry={entry}
                  onClick={handleCardClick}
                />
              ))}

              {filtered.length === 0 && (
                <p
                  className="col-span-full py-12 text-center text-sm"
                  style={{ color: "var(--help-text-muted)" }}
                >
                  No matching tools
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export { HelpModal };
export type { HelpModalProps };
