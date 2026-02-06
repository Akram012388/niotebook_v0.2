"use client";

import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import type { ReactElement } from "react";
import { AuthShell } from "@/ui/auth/AuthShell";
import { BootSequence } from "@/ui/auth/BootSequence";
import { clerkAppearance } from "@/ui/auth/clerkAppearance";

const fadeUpSlow = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
});

const SignInPage = (): ReactElement => {
  return (
    <AuthShell
      title="Sign in"
      subtitle="Niotebook alpha is invite-only. Use the email code from your invite to continue."
      sideContent={
        <motion.div {...fadeUpSlow(0.3)}>
          <BootSequence />
        </motion.div>
      }
    >
      <motion.div {...fadeUpSlow(0.2)}>
        <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent/60 mb-3">
          Sign in to your account
        </p>
        <SignIn
          appearance={clerkAppearance}
          routing="path"
          path="/sign-in"
          signUpUrl=""
          fallbackRedirectUrl="/courses"
        />
      </motion.div>
    </AuthShell>
  );
};

export default SignInPage;
