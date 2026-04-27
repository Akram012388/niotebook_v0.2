"use client";

import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { ReactElement } from "react";
import { clerkAppearance } from "@/ui/auth/clerkAppearance";

const fadeUpSlow = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
});

export default function ClerkSignInForm(): ReactElement {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const redirectIfNewUser = () => {
      const normalizedText = form.textContent?.toLowerCase() ?? "";
      if (
        normalizedText.includes("couldn't find your account") ||
        normalizedText.includes("could not find your account")
      ) {
        router.replace("/sign-up");
      }
    };

    redirectIfNewUser();

    const observer = new MutationObserver(redirectIfNewUser);
    observer.observe(form, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [router]);

  return (
    <motion.div
      ref={formRef}
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
