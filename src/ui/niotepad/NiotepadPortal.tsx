"use client";

import { useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { useNiotepadStore } from "@/infra/niotepad/useNiotepadStore";
import { NiotepadPanel } from "./NiotepadPanel";

const NiotepadPortal = (): ReactElement | null => {
  const isOpen = useNiotepadStore((s) => s.isOpen);

  // If the portal mounts with isOpen already true (e.g. after HMR/hot-reload),
  // skip the entrance animation so content is immediately visible instead of
  // starting at opacity: 0 and waiting for the spring to complete.
  // useState initializer captures isOpen once at mount — no ref access in render.
  const [mountedWhileOpen] = useState(() => isOpen);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence initial={!mountedWhileOpen}>
      {isOpen && <NiotepadPanel />}
    </AnimatePresence>,
    document.body,
  );
};

export { NiotepadPortal };
