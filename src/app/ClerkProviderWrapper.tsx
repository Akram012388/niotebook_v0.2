import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

type ClerkProviderWrapperProps = {
  children: ReactNode;
};

export function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
