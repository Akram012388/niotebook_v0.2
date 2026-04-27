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
          signUpUrl="/sign-up"
        />
      </div>
    </motion.div>
  );
}
