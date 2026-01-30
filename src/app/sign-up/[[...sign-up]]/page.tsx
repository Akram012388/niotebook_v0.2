"use client";

import { SignUp } from "@clerk/nextjs";
import type { ReactElement } from "react";
import { AuthShell } from "@/ui/auth/AuthShell";
import { clerkAppearance } from "@/ui/auth/clerkAppearance";

const SignUpPage = (): ReactElement => {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Complete the invite flow with your email code to enter the alpha."
    >
      <SignUp
        appearance={clerkAppearance}
        routing="path"
        path="/sign-up"
        fallbackRedirectUrl="/"
        signInUrl="/sign-in"
      />
    </AuthShell>
  );
};

export default SignUpPage;
