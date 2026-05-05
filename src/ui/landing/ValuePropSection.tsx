"use client";

import Image from "next/image";
import { type ReactElement } from "react";
import { motion } from "framer-motion";

const UNIVERSITIES = ["Harvard", "MIT", "Yale", "Stanford"] as const;

const STORIES = [
  {
    eyebrow: "The Library",
    title: "World-class CS courses without the LMS drag.",
    description:
      "Start from open courseware that already has depth: lectures, assignments, and serious curriculum. Niotebook keeps that academic signal and removes the scattered-tool friction around it.",
    image: "/landing/course-wedge.png",
    alt: "Niotebook course selection with CS50 courseware in the control center",
    width: 2940,
    height: 1670,
  },
  {
    eyebrow: "The Editor",
    title: "The lecture and runtime stay in the same thought.",
    description:
      "Code beside the lesson, switch languages, run the terminal, and keep the context visible. The editor is not an embedded toy. It behaves like a real workspace made for learning.",
    image: "/landing/code-ai-focused.png",
    alt: "Niotebook code editor and AI tutor focused view",
    width: 2940,
    height: 1668,
  },
  {
    eyebrow: "The Intelligence",
    title: "Nio understands where you are stuck.",
    description:
      "The assistant sees the lecture moment, the active file, and the code you are shaping. It explains the next step without flattening the problem into a generic chatbot answer.",
    image: "/landing/context-aware-ai.png",
    alt: "Niotebook context-aware AI assistant beside a lecture",
    width: 2940,
    height: 1670,
  },
] as const;

export function ValuePropSection(): ReactElement {
  return (
    <section className="relative z-[2] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="border-y border-border py-8 text-center"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55 }}
        >
          <p className="text-xs font-mono uppercase tracking-[0.22em] text-accent/70">
            Built on world-class open courseware
          </p>
          <div
            className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
            aria-label="Featured university courses"
          >
            {UNIVERSITIES.map((uni) => (
              <span
                key={uni}
                className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
              >
                {uni}
              </span>
            ))}
          </div>
          <p className="mt-5 text-sm text-text-muted">
            6+ courses · 5 languages · 100% free · 0 tab switches
          </p>
        </motion.div>

        <div className="mt-20 flex flex-col gap-24 sm:gap-28">
          {STORIES.map((story) => (
            <motion.article
              key={story.eyebrow}
              className="grid items-center gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{ duration: 0.65 }}
            >
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.24em] text-accent/70">
                  {story.eyebrow}
                </p>
                <h2 className="mt-5 max-w-xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
                  {story.title}
                </h2>
                <p className="mt-6 max-w-lg text-base leading-8 text-text-muted sm:text-lg">
                  {story.description}
                </p>
              </div>

              <div>
                <div className="overflow-hidden rounded-[24px] border border-border bg-surface shadow-[0_24px_70px_rgba(28,25,23,0.12)]">
                  <Image
                    src={story.image}
                    alt={story.alt}
                    width={story.width}
                    height={story.height}
                    loading="eager"
                    unoptimized
                    className="h-auto w-full"
                    sizes="(max-width: 768px) 100vw, 720px"
                  />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
