"use client";

import { type ReactElement } from "react";
import { motion } from "framer-motion";
import { NotebookFrame } from "./NotebookFrame";

interface ValueProp {
  title: string;
  description: string;
}

const VALUE_PROPS: ValueProp[] = [
  {
    title: "The Library",
    description:
      "The best free CS courses from institutions who believe education should be open to everyone. Every lecture, every assignment, completely free. We just made the experience of learning from them radically better.",
  },
  {
    title: "The Editor",
    description:
      "No more tab-switching between the lecture and your IDE. The integrated code editor lives right next to the video \u2014 syntax highlighting, multi-language support, and instant execution. Pause, edit, run, see the result.",
  },
  {
    title: "The Intelligence",
    description:
      "Not a chatbot that guesses. Nio knows what lecture you\u2019re watching, what code you\u2019ve written, and exactly where you\u2019re stuck. It nudges you toward understanding rather than handing you solutions.",
  },
];

const UNIVERSITIES = ["Harvard", "MIT", "Yale", "Stanford"] as const;

export function ValuePropSection(): ReactElement {
  return (
    <section className="relative z-[2] py-12 sm:py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <NotebookFrame>
          <motion.div
            className="text-center mb-10 sm:mb-12"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] mb-4 text-accent/60">
              What makes Niotebook different
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              The best free courses.
              <br />
              <span className="text-text-muted">
                A better way to learn from them.
              </span>
            </h2>
          </motion.div>

          <div className="flex flex-col gap-10 sm:gap-12 max-w-xl mx-auto">
            {VALUE_PROPS.map((prop, i) => (
              <motion.div
                key={prop.title}
                className="text-center"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <h3 className="text-lg sm:text-xl font-semibold tracking-tight mb-2">
                  {prop.title}
                </h3>
                <p className="text-sm sm:text-base leading-relaxed text-text-muted">
                  {prop.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* University credibility + stats — closing element */}
          <motion.div
            className="text-center mt-12 sm:mt-16 pt-10 sm:pt-12 border-t border-border/40"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] mb-5 text-accent/60">
              Built on world-class open courseware
            </p>

            <div
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-5"
              aria-label="Featured university courses"
            >
              {UNIVERSITIES.map((uni) => (
                <span
                  key={uni}
                  className="text-xl sm:text-2xl font-semibold tracking-tight"
                >
                  {uni}
                </span>
              ))}
            </div>

            <p className="text-sm text-text-muted">
              <span>6+ courses</span>
              <span className="mx-2 text-border" aria-hidden="true">
                &middot;
              </span>
              <span>5 languages</span>
              <span className="mx-2 text-border" aria-hidden="true">
                &middot;
              </span>
              <span>100% free</span>
              <span className="mx-2 text-border" aria-hidden="true">
                &middot;
              </span>
              <span>0 tab switches</span>
            </p>
          </motion.div>
        </NotebookFrame>
      </div>
    </section>
  );
}
