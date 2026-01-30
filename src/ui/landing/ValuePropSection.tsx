"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";

interface ValueProp {
  icon: ReactElement;
  label: string;
  title: string;
  description: string;
}

function LibraryIcon(): ReactElement {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h6" />
    </svg>
  );
}

function EditorIcon(): ReactElement {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
      <line x1="14" y1="4" x2="10" y2="20" />
    </svg>
  );
}

function AssistantIcon(): ReactElement {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      "Niotebook is the digital library of the best free MOOCs — massive open online courseware from institutions like Harvard, MIT, and creators who believe education should be accessible to everyone. Every course, every lecture, completely free and open source. We just made the experience of learning from them radically better.",
  },
  {
    icon: <EditorIcon />,
    label: "The Editor",
    title: "A smart code editor that follows along.",
    description:
      "No more tab-switching between the lecture and your IDE. Niotebook\u2019s integrated code editor lives right next to the video — syntax highlighting, multi-language support, and instant execution. Pause the lecture, edit the code, run it, see the result. All without leaving the canvas.",
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
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isReversed = index % 2 === 1;

  return (
    <div
      ref={ref}
      className="transition-all duration-700"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transitionDelay: "100ms",
      }}
    >
      <div
        className={`flex flex-col ${isReversed ? "md:flex-row-reverse" : "md:flex-row"} items-start gap-8 md:gap-12`}
      >
        {/* Icon + label */}
        <div className="flex-shrink-0 flex flex-col items-start gap-3 md:w-48">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl"
            style={{
              background: "var(--surface-muted)",
              border: "1px solid var(--border)",
              color: "var(--accent)",
            }}
          >
            {prop.icon}
          </div>
          <span
            className="text-[11px] font-mono uppercase tracking-[0.15em] font-semibold"
            style={{ color: "var(--text-subtle)" }}
          >
            {prop.label}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-3 leading-snug">
            {prop.title}
          </h3>
          <p
            className="text-sm sm:text-base leading-relaxed max-w-xl"
            style={{ color: "var(--text-muted)" }}
          >
            {prop.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ValuePropSection(): ReactElement {
  return (
    <section className="relative py-24 sm:py-32 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 sm:mb-20">
          <p
            className="text-[11px] font-mono uppercase tracking-[0.2em] mb-4"
            style={{ color: "var(--text-subtle)" }}
          >
            What makes Niotebook different
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            The best free courses.
            <br />
            <span style={{ color: "var(--text-muted)" }}>
              A better way to learn from them.
            </span>
          </h2>
        </div>

        <div className="flex flex-col gap-16 sm:gap-20">
          {VALUE_PROPS.map((prop, i) => (
            <ValueCard key={prop.label} prop={prop} index={i} />
          ))}
        </div>

        {/* Credit line */}
        <div className="mt-16 sm:mt-20 text-center">
          <p
            className="text-xs sm:text-sm leading-relaxed max-w-lg mx-auto"
            style={{ color: "var(--text-subtle)" }}
          >
            All courses are freely available thanks to institutions and creators
            like Harvard, MIT, Yale, and others who believe great education
            should be open to everyone. We{"'"}re just building the best
            environment to learn from them.
          </p>
        </div>
      </div>
    </section>
  );
}
