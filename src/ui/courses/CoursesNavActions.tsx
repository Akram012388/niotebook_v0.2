"use client";

import { type ReactElement } from "react";
import { useDevAuthBypass } from "@/infra/dev/devAuthBypassContext";
import { ThemeToggle } from "@/ui/shared/ThemeToggle";
import dynamic from "next/dynamic";

// Lazy-load the sign-out button to avoid pulling @clerk/nextjs when bypass is active.
const ClerkSignOutButton = dynamic(() => import("./ClerkSignOutButton"));

export function CoursesNavActions(): ReactElement {
  const isDevBypass = useDevAuthBypass();

  return (
    <>
      <ThemeToggle />
      {!isDevBypass && <ClerkSignOutButton />}
    </>
  );
}
