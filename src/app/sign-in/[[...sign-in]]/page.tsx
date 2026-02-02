"use client";

import { SignIn } from "@clerk/nextjs";
import type { ReactElement } from "react";
import { BootSequence } from "@/ui/auth/BootSequence";
import { clerkAppearance } from "@/ui/auth/clerkAppearance";
import { Wordmark } from "@/ui/brand/Wordmark";
import { ForceTheme } from "@/ui/ForceTheme";

const SignInPage = (): ReactElement => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <ForceTheme theme="dark" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.18),_transparent_55%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] flex-col justify-center px-6 py-12">
        <div className="mb-6">
          <Wordmark height={28} />
          <h1 className="mt-3 text-3xl font-semibold text-foreground">
            Sign in
          </h1>
          <p className="mt-2 max-w-md text-sm text-text-muted">
            Niotebook alpha is invite-only. Use the email code from your invite
            to continue.
          </p>
        </div>
        <div className="flex items-start gap-8">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <SignIn
              appearance={clerkAppearance}
              routing="path"
              path="/sign-in"
              signUpUrl="/sign-up"
              fallbackRedirectUrl="/courses"
            />
          </div>
          <div className="hidden w-full max-w-sm md:block">
            <BootSequence />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
