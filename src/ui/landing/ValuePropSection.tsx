"use client";

import { type ReactElement } from "react";
import { motion } from "framer-motion";

interface ValueProp {
  icon: ReactElement;
  label: string;
  title: string;
  description: string;
}

function LibraryIcon(): ReactElement {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h6" />
    </svg>
  );
}

function EditorIcon(): ReactElement {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
      <line x1="14" y1="4" x2="10" y2="20" />
    </svg>
  );
}

function AssistantIcon(): ReactElement {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
      <line x1="9" y1="21" x2="15" y2="21" />
      <line x1="10" y1="23" x2="14" y2="23" />
    </svg>
  );
}

const VALUE_PROPS: ValueProp[] = [
  {
    icon: <LibraryIcon />,
    label: "The Library",
    title: "The world\u2019s best CS courses. Free. Open. All in one place.",
    description:
      "Niotebook is the digital library of the best free MOOCs \u2014 massive open online courseware from institutions like Harvard, MIT, and creators who believe education should be accessible to everyone. Every course, every lecture, completely free and open source. We just made the experience of learning from them radically better.",
  },
  {
    icon: <EditorIcon />,
    label: "The Editor",
    title: "A smart code editor that follows along.",
    description:
      "No more tab-switching between the lecture and your IDE. Niotebook\u2019s integrated code editor lives right next to the video \u2014 syntax highlighting, multi-language support, and instant execution. Pause the lecture, edit the code, run it, see the result. All without leaving the canvas.",
  },
  {
    icon: <AssistantIcon />,
    label: "The Intelligence",
    title: "A friendly, Socratic AI that actually gets it.",
    description:
      "Not a chatbot that guesses. Nio knows what lecture you\u2019re watching, what code you\u2019ve written, and exactly where you\u2019re stuck. It asks questions before giving answers, nudging you toward understanding rather than handing you solutions. Like a brilliant TA who never sleeps.",
  },
];

function ValueCard({
  prop,
  index,
}: {
  prop: ValueProp;
  index: number;
}): ReactElement {
  const isReversed = index % 2 === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <div
        className={`flex flex-col ${isReversed ? "md:flex-row-reverse" : "md:flex-row"} items-start gap-8 md:gap-12`}
      >
        {/* Icon + label */}
        <div className="flex-shrink-0 flex flex-col items-start gap-3 md:w-48">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl border border-accent/20 bg-accent/5 text-accent">
            {prop.icon}
          </div>
          <span className="text-[11px] font-mono uppercase tracking-[0.15em] font-semibold text-accent/70">
            {prop.label}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-3 leading-snug">
            {prop.title}
          </h3>
          <p className="text-sm sm:text-base leading-relaxed max-w-xl text-text-muted">
            {prop.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function ValuePropSection(): ReactElement {
  return (
    <section className="relative py-16 sm:py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
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

        <div className="flex flex-col gap-12 sm:gap-14">
          {VALUE_PROPS.map((prop, i) => (
            <ValueCard key={prop.label} prop={prop} index={i} />
          ))}
        </div>

        {/* Credit line */}
        <motion.div
          className="mt-12 sm:mt-14 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs sm:text-sm leading-relaxed max-w-lg mx-auto text-text-subtle">
            All courses are freely available thanks to institutions and creators
            like Harvard, MIT, Yale, and others who believe great education
            should be open to everyone. We{"'"}re just building the best
            environment to learn from them.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
