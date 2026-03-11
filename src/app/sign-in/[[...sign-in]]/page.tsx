"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useEffect, type ReactElement } from "react";
import { useDevAuthBypass } from "@/infra/dev/devAuthBypassContext";
import { AuthShell } from "@/ui/auth/AuthShell";
import { BootSequence } from "@/ui/auth/BootSequence";
import { MobileGate } from "@/ui/shared/MobileGate";

// Lazy-load the Clerk sign-in form to avoid pulling @clerk/nextjs when bypass is active.
const ClerkSignInForm = dynamic(() => import("./ClerkSignInForm"));

const fadeUpSlow = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
});

const SignInPage = (): ReactElement => {
  const isDevBypass = useDevAuthBypass();

  /* Suppress the browser's native "Please fill out this field" tooltip.
     The `invalid` event does NOT bubble, so we must listen at the document
     level in capture phase to intercept it before the tooltip renders.
     Preventing default stops the tooltip; Clerk handles its own errors. */
  useEffect(() => {
    const suppress = (e: Event) => e.preventDefault();
    document.addEventListener("invalid", suppress, true);
    return () => document.removeEventListener("invalid", suppress, true);
  }, []);

  if (isDevBypass) {
    return (
      <MobileGate>
        <AuthShell
          title="Sign in"
          subtitle="Dev auth bypass is active — authentication is skipped."
          sideContent={
            <motion.div className="flex flex-1" {...fadeUpSlow(0.3)}>
              <BootSequence />
            </motion.div>
          }
        >
          <div className="rounded-xl border border-dashed border-border bg-surface-muted px-4 py-6 text-sm text-text-muted font-mono">
            Dev auth bypass enabled. Redirecting is not needed.
          </div>
        </AuthShell>
      </MobileGate>
    );
  }

  return (
    <MobileGate>
      <AuthShell
        title="Sign in"
        subtitle="Welcome back. Sign in to continue."
        sideContent={
          <motion.div className="flex flex-1" {...fadeUpSlow(0.3)}>
            <BootSequence />
          </motion.div>
        }
      >
        <ClerkSignInForm />
      </AuthShell>
    </MobileGate>
  );
};

export default SignInPage;
