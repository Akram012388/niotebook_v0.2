"use client";

import { type ReactElement } from "react";
import { motion } from "framer-motion";
import { NotebookFrame } from "./NotebookFrame";

const UNIVERSITIES = ["Harvard", "MIT", "Yale", "Stanford"] as const;

export function StatsSection(): ReactElement {
  return (
    <section className="relative py-12 sm:py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <NotebookFrame>
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] mb-5 text-accent/60">
              Built on world-class open courseware
            </p>

            {/* University names */}
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

            {/* Compact stats */}
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
