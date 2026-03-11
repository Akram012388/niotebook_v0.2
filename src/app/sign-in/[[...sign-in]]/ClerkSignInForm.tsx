"use client";

import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import type { ReactElement } from "react";
import { clerkAppearance } from "@/ui/auth/clerkAppearance";

const fadeUpSlow = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
});

export default function ClerkSignInForm(): ReactElement {
  return (
    <motion.div
      className="flex flex-col rounded-2xl border border-border dark:border-accent-border bg-surface shadow-sm overflow-hidden"
      {...fadeUpSlow(0.2)}
    >
      <div className="flex-1">
        <SignIn
          appearance={clerkAppearance}
          routing="path"
          path="/sign-in"
          fallbackRedirectUrl="/courses"
        />
      </div>
      <div className="border-t border-border-muted px-6 py-4 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs text-text-subtle">
          <span>Secured by</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12.596 3.904a1.6 1.6 0 0 0-.544-.384 5.6 5.6 0 0 0-8.104 0 1.6 1.6 0 0 0-.544.384A5.6 5.6 0 0 0 8 14.4a5.6 5.6 0 0 0 4.596-10.496ZM8 12.8a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
              fill="currentColor"
            />
          </svg>
          <span className="font-medium">clerk</span>
        </div>
        <p className="mt-1 text-[10px] font-medium text-accent">
          Development mode
        </p>
      </div>
    </motion.div>
  );
}
