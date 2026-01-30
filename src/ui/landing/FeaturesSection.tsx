"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";

interface Feature {
  icon: ReactElement;
  title: string;
  description: string;
}

function SyncIcon(): ReactElement {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="12" height="9" rx="2" />
      <rect x="18" y="4" width="12" height="9" rx="2" />
      <path d="M8 13v4a2 2 0 002 2h12a2 2 0 002-2v-4" />
      <path d="M16 19v7" />
      <path d="M12 26h8" />
    </svg>
  );
}

function AiIcon(): ReactElement {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="12" r="6" />
      <path d="M16 6V2" />
      <path d="M10.8 8.2L8 5.4" />
      <path d="M21.2 8.2L24 5.4" />
      <path d="M8 16H4" />
      <path d="M28 16h-4" />
      <path d="M6 26h20" />
      <path d="M10 18v4a2 2 0 002 2h8a2 2 0 002-2v-4" />
    </svg>
  );
}

function LanguageIcon(): ReactElement {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 8l-4 8h8" />
      <path d="M6 13h4" />
      <rect x="18" y="6" width="10" height="12" rx="1.5" />
      <path d="M21 10h4" />
      <path d="M21 13h2" />
      <path d="M4 22h24" />
      <path d="M8 26h16" />
    </svg>
  );
}

function DoingIcon(): ReactElement {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h16" />
      <path d="M4 14h12" />
      <path d="M4 20h8" />
      <circle cx="24" cy="20" r="6" />
      <path d="M22 20l2 2 3-3" />
    </svg>
  );
}

const FEATURES: Feature[] = [
  {
    icon: <SyncIcon />,
    title: "Video + Code in Sync",
    description: "The lecture plays. The editor follows. Pause the video — the code is already there, cursor blinking, ready for you to run.",
  },
  {
    icon: <AiIcon />,
    title: "AI That Reads the Room",
    description: "Your tutor knows what slide you're on, what code you wrote, and where you got lost. Context-aware help, not generic answers.",
  },
  {
    icon: <LanguageIcon />,
    title: "Python, JS, C, and More",
    description: "Switch languages mid-lesson. The runtime follows. From Python scripts to C pointers — one workspace, every language.",
  },
  {
    icon: <DoingIcon />,
    title: "Learn by Shipping",
    description: "Every concept becomes runnable code in seconds. No setup, no boilerplate. Type, run, understand — then do it again.",
  },
];

function FeatureCard({ feature, index }: { feature: Feature; index: number }): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="group relative p-6 sm:p-8 rounded-xl transition-all duration-700"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${index * 120}ms`,
      }}
    >
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--surface-muted), transparent 60%)`,
        }}
      />
      <div className="relative">
        <div className="mb-4" style={{ color: 'var(--accent)' }}>
          {feature.icon}
        </div>
        <h3 className="text-base sm:text-lg font-semibold mb-2">{feature.title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {feature.description}
        </p>
      </div>
    </div>
  );
}

export function FeaturesSection(): ReactElement {
  return (
    <section className="relative py-24 sm:py-32 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 sm:mb-20">
          <p className="text-xs font-mono uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--text-subtle)' }}>
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            One canvas.<br />Everything you need.
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
