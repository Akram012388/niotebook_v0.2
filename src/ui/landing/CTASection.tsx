"use client";

import Link from "next/link";
import { type ReactElement } from "react";
import { motion } from "framer-motion";

export function CTASection(): ReactElement {
  return (
    <section className="relative py-24 sm:py-32 px-4 sm:px-6">
      <motion.div
        className="max-w-3xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
      >
        {/* Decorative code snippet */}
        <div className="inline-block font-mono text-xs px-4 py-2 rounded-lg mb-8 border border-border bg-surface-muted">
          <span className="text-text-muted">$</span>{" "}
          <span className="text-foreground">niotebook</span>{" "}
          <span className="text-workspace-accent">--start</span>{" "}
          <span className="text-text-subtle">your-cs-journey</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Stop watching tutorials.
          <br />
          <span className="text-text-muted">Start building knowledge.</span>
        </h2>

        <p className="text-sm sm:text-base mb-10 max-w-md mx-auto text-text-subtle">
          Join the beta. It&apos;s free, it&apos;s fast, and your IDE will thank
          you.
        </p>

        <Link
          href="/workspace"
          className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-workspace-accent text-[#0A0A0A] hover:shadow-[0_0_40px_rgba(0,255,102,0.25)]"
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
      </motion.div>
    </section>
  );
}

export function LandingFooter(): ReactElement {
  return (
    <footer className="py-8 text-center border-t border-border">
      <p className="text-xs font-mono text-text-subtle">
        © {new Date().getFullYear()} Niotebook · Built for learners who ship
      </p>
    </footer>
  );
}
