"use client";

import Link from "next/link";
import { type ReactElement } from "react";
import { motion } from "framer-motion";
import { NotebookFrame } from "./NotebookFrame";

export function CTASection(): ReactElement {
  return (
    <section className="relative z-[2] py-12 sm:py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <NotebookFrame>
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Stop watching tutorials.
              <br />
              <span className="text-text-muted">
                Start building knowledge.
              </span>
            </h2>

            <p className="text-sm sm:text-base mb-8 max-w-md mx-auto text-text-subtle">
              Join the beta. It&apos;s free, it&apos;s fast, and your IDE will
              thank you.
            </p>

            <Link
              href="/workspace"
              className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-accent text-accent-foreground hover:shadow-[0_0_40px_var(--accent-muted)]"
            >
              Start Learning
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>

            {/* Copyright — merged from LandingFooter */}
            <p className="mt-10 text-xs font-mono text-text-subtle">
              &copy; {new Date().getFullYear()} Niotebook &middot; Built for
              learners who ship
            </p>
          </motion.div>
        </NotebookFrame>
      </div>
    </section>
  );
}

/**
 * Footer content has been merged into CTASection.
 * This export is kept for backwards compatibility with page.tsx.
 */
export function LandingFooter(): ReactElement | null {
  return null;
}
