"use client";

import Link from "next/link";
import { type ReactElement } from "react";
import { motion } from "framer-motion";

export function CTASection(): ReactElement {
  return (
    <section className="relative z-[2] px-4 py-20 sm:px-6 sm:py-28">
      <motion.div
        className="mx-auto max-w-7xl border-y border-border py-16 text-center sm:py-20"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.65 }}
      >
        <p className="text-xs font-mono uppercase tracking-[0.24em] text-accent/70">
          Start with the next lecture
        </p>
        <h2 className="mx-auto mt-6 max-w-4xl text-5xl font-bold leading-[0.95] tracking-tight text-foreground sm:text-6xl md:text-7xl">
          Stop collecting tabs.
          <span className="block text-text-muted">
            Start building knowledge.
          </span>
        </h2>
        <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-text-muted sm:text-lg">
          The best courseware already exists. Niotebook turns it into a place
          where you can practice, ask better questions, and keep momentum.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/sign-up"
            className="inline-flex h-12 items-center gap-2 rounded-[999px] bg-accent px-6 text-sm font-semibold leading-none text-accent-foreground shadow-sm transition duration-200 hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
          >
            Start Learning
            <span aria-hidden="true">-&gt;</span>
          </Link>
          <span className="text-sm text-text-subtle">
            Free beta · open courseware · real workspace
          </span>
        </div>
      </motion.div>
    </section>
  );
}
