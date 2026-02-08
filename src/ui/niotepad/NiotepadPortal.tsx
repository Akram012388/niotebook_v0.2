"use client";

import { type ReactElement } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { useNiotepadStore } from "@/infra/niotepad/useNiotepadStore";
import { NiotepadBackdrop } from "./NiotepadBackdrop";
import { NiotepadPanel } from "./NiotepadPanel";

const NiotepadPortal = (): ReactElement | null => {
  const isOpen = useNiotepadStore((s) => s.isOpen);
  const closePanel = useNiotepadStore((s) => s.closePanel);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <NiotepadBackdrop onDismiss={closePanel} />
          <NiotepadPanel />
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export { NiotepadPortal };
