"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";

export function CTASection(): ReactElement {
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
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative py-24 sm:py-32 px-4 sm:px-6">
      <div
        ref={ref}
        className="max-w-3xl mx-auto text-center transition-all duration-1000"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
      >
        {/* Decorative code snippet */}
        <div
          className="inline-block font-mono text-xs px-4 py-2 rounded-lg mb-8"
          style={{ background: 'var(--surface-muted)', color: 'var(--text-subtle)', border: '1px solid var(--border)' }}
        >
          <span style={{ color: 'var(--text-muted)' }}>$</span> niotebook <span style={{ color: 'var(--accent)' }}>--start</span> your-cs-journey
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Stop watching tutorials.
          <br />
          <span style={{ color: 'var(--text-muted)' }}>Start building knowledge.</span>
        </h2>

        <p className="text-sm sm:text-base mb-10 max-w-md mx-auto" style={{ color: 'var(--text-subtle)' }}>
          Join the beta. It&apos;s free, it&apos;s fast, and your IDE will thank you.
        </p>

        <a
          href="/sign-in"
          className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg"
          style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
        >
          Start Learning
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </a>
      </div>

    </section>
  );
}

export function LandingFooter(): ReactElement {
  return (
    <footer className="py-8 text-center" style={{ borderTop: '1px solid var(--border)' }}>
      <p className="text-xs font-mono" style={{ color: 'var(--text-subtle)' }}>
        © {new Date().getFullYear()} Niotebook · Built for learners who ship
      </p>
    </footer>
  );
}
