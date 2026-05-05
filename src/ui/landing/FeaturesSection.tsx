"use client";

import Image from "next/image";
import { type ReactElement } from "react";
import { motion } from "framer-motion";

const STEPS = [
  {
    label: "Pick a course",
    detail: "Choose a serious open CS track and land directly in the lesson.",
  },
  {
    label: "Watch the lecture",
    detail: "Keep the source material visible, paced, and grounded.",
  },
  {
    label: "Code beside it",
    detail: "Run ideas immediately in the same workspace.",
  },
  {
    label: "Ask Nio",
    detail: "Get help that knows the timestamp, the code, and the lesson.",
  },
] as const;

export function FeaturesSection(): ReactElement {
  return (
    <section className="relative z-[2] overflow-hidden px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="grid items-start gap-10 border-y border-border py-12 lg:grid-cols-[0.72fr_1fr]"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.24em] text-accent/70">
              How it works
            </p>
            <h2 className="mt-5 max-w-xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
              One canvas.
              <span className="block text-text-muted">
                Everything stays connected.
              </span>
            </h2>
          </div>

          <div className="grid gap-0">
            {STEPS.map((step, index) => (
              <div
                key={step.label}
                className="grid grid-cols-[56px_1fr] border-t border-border py-6 first:border-t-0"
              >
                <div className="font-mono text-sm text-accent">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="grid gap-2 sm:grid-cols-[0.62fr_1fr] sm:gap-8">
                  <h3 className="text-xl font-semibold tracking-tight text-foreground">
                    {step.label}
                  </h3>
                  <p className="text-sm leading-7 text-text-muted">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="mt-20 border-y border-border py-14 sm:py-20">
          <motion.div
            className="grid items-end gap-8 lg:grid-cols-[0.72fr_1fr]"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65, delay: 0.08 }}
          >
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.24em] text-accent/70">
                Bring your own key
              </p>
              <h2 className="mt-5 max-w-2xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
                Your learning loop stays yours.
              </h2>
            </div>

            <p className="max-w-2xl text-base leading-8 text-text-muted sm:text-lg lg:justify-self-end">
              Niotebook can stay free while letting learners choose their AI
              provider. It is a practical beta path: honest costs, local
              control, and no mystery layer between a student and the tools they
              trust.
            </p>
          </motion.div>

          <motion.div
            className="mt-10 overflow-hidden rounded-[24px] border border-border bg-surface shadow-[0_24px_70px_rgba(28,25,23,0.12)]"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65, delay: 0.08 }}
          >
            <Image
              src="/landing/byok-provider.png"
              alt="Niotebook control center showing AI provider settings"
              width={2940}
              height={1668}
              loading="eager"
              unoptimized
              className="h-auto w-full"
              sizes="(max-width: 1024px) 100vw, 1180px"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
