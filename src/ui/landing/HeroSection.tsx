"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactElement } from "react";
import { motion } from "framer-motion";

const HERO_STATS = [
  "6+ courses",
  "5 languages",
  "100% free",
  "0 tab switches",
] as const;

export function HeroSection(): ReactElement {
  return (
    <section className="relative z-[2] overflow-hidden px-4 pt-28 pb-20 sm:px-6 sm:pt-32 lg:pt-36">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-end gap-10 lg:grid-cols-[0.82fr_1fr] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="mb-8 inline-flex items-center gap-2 border-y border-border py-2 pr-4 text-xs font-medium text-text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Now in beta
            </div>

            <h1 className="max-w-4xl text-6xl font-bold leading-[0.88] tracking-tight text-foreground sm:text-7xl md:text-8xl xl:text-9xl">
              <span className="block">watch.</span>
              <span className="block text-accent">code.</span>
              <span className="block">learn.</span>
            </h1>
          </motion.div>

          <motion.div
            className="max-w-xl lg:pb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
          >
            <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Your CS lecture just became an IDE.
            </p>
            <p className="mt-5 text-base leading-8 text-text-muted sm:text-lg">
              Niotebook brings the lecture, editor, terminal, and context-aware
              AI tutor into one focused canvas. No setup ritual. No tab maze.
              Just watch, run, ask, and understand.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/sign-up"
                className="inline-flex h-12 w-fit items-center gap-2 rounded-[999px] bg-accent px-6 text-sm font-semibold leading-none text-accent-foreground shadow-sm transition duration-200 hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
              >
                Start Learning
                <span aria-hidden="true">-&gt;</span>
              </Link>
              <span className="text-sm text-text-subtle">
                Free and open source
              </span>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-4 border-y border-border py-5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {HERO_STATS.map((stat) => (
                <div key={stat}>
                  <dt className="sr-only">Niotebook stat</dt>
                  <dd className="text-sm font-semibold text-foreground">
                    {stat}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </div>

        <motion.div
          className="mt-14 lg:mt-18"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.25 }}
        >
          <div className="relative overflow-hidden rounded-[28px] border border-border bg-surface shadow-[0_32px_90px_rgba(28,25,23,0.16)]">
            <div className="flex items-center justify-between border-b border-border bg-surface-muted/80 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-text-subtle">
                <span className="h-2 w-2 rounded-full bg-accent" />
                Live workspace
              </div>
              <div className="hidden items-center gap-5 text-xs font-medium text-text-muted sm:flex">
                <span>Lecture</span>
                <span>Code</span>
                <span>Nio</span>
              </div>
            </div>
            <Image
              src="/landing/workspace-full-stack.png"
              alt="Niotebook workspace with lecture video, code editor, terminal, and AI assistant"
              width={2940}
              height={1668}
              priority
              unoptimized
              className="h-auto w-full"
              sizes="(max-width: 768px) 1200px, 1280px"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
