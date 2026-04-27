"use client";

import { SignUp } from "@clerk/nextjs";
import { motion } from "framer-motion";
import type { ReactElement } from "react";
import { AuthShell } from "@/ui/auth/AuthShell";
import { clerkAppearance } from "@/ui/auth/clerkAppearance";
import { MobileGate } from "@/ui/shared/MobileGate";

const fadeUpSlow = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
});

const SignUpPage = (): ReactElement => {
  return (
    <MobileGate>
      <AuthShell title="Welcome" subtitle="Enter your email to continue.">
        <motion.div
          className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm dark:border-accent-border"
          {...fadeUpSlow(0.2)}
        >
          <div className="flex-1">
            <SignUp
              appearance={clerkAppearance}
              routing="path"
              path="/sign-up"
              fallbackRedirectUrl="/courses"
              signInUrl="/sign-in"
            />
          </div>
        </motion.div>
      </AuthShell>
    </MobileGate>
  );
};

export default SignUpPage;
