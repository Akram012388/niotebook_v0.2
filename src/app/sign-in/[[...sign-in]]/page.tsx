"use client";

import { SignIn } from "@clerk/nextjs";
import type { ReactElement } from "react";
import { AuthShell } from "@/ui/auth/AuthShell";
import { clerkAppearance } from "@/ui/auth/clerkAppearance";

const SignInPage = (): ReactElement => {
  return (
    <AuthShell
      title="Sign in"
      subtitle="Niotebook alpha is invite-only. Use the email code from your invite to continue."
    >
      <SignIn
        appearance={clerkAppearance}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
      />
    </AuthShell>
  );
};

export default SignInPage;
