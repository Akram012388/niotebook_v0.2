"use client";

import { type ReactElement } from "react";
import Link from "next/link";
import { ForceTheme } from "@/ui/ForceTheme";
import { Wordmark } from "@/ui/brand/Wordmark";

export default function TermsPage(): ReactElement {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ForceTheme theme="dark" />
      <div className="mx-auto max-w-2xl px-6 py-20 sm:py-28">
        <Wordmark height={24} className="mb-10" />
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
          Terms of Service
        </h1>
        <p className="text-sm leading-relaxed text-text-muted mb-6">
          This page will contain the Niotebook Terms of Service. We are
          currently drafting these terms and will publish them here before
          general availability.
        </p>
        <p className="text-sm leading-relaxed text-text-muted mb-10">
          If you have questions in the meantime, please reach out at{" "}
          <a
            href="mailto:hello@niotebook.com"
            className="text-accent hover:underline"
          >
            hello@niotebook.com
          </a>
          .
        </p>
        <Link
          href="/"
          className="text-sm text-text-subtle hover:text-accent transition-colors"
        >
          &larr; Back to home
        </Link>
      </div>
    </div>
  );
}
