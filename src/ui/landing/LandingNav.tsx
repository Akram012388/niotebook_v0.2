import Link from "next/link";
import { type ReactElement } from "react";
import { Wordmark } from "../brand/Wordmark";
import { ThemeToggle } from "./ThemeToggle";

export function LandingNav(): ReactElement {
  return (
    <nav
      aria-label="Main"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4 backdrop-blur-md"
      style={{
        background: "color-mix(in srgb, var(--background) 80%, transparent)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <Wordmark height={40} />
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link
          href="/sign-in"
          className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          style={{
            background: "var(--surface-muted)",
            color: "var(--foreground)",
          }}
        >
          Sign in
        </Link>
      </div>
    </nav>
  );
}
