"use client";

import type { ReactElement } from "react";
import { motion } from "framer-motion";

interface NiotepadBackdropProps {
  onDismiss: () => void;
}

const NiotepadBackdrop = ({ onDismiss }: NiotepadBackdropProps): ReactElement => {
  return (
    <motion.div
      className="fixed inset-0 z-[49]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      onClick={onDismiss}
      role="presentation"
      aria-hidden="true"
    />
  );
};

export { NiotepadBackdrop };
