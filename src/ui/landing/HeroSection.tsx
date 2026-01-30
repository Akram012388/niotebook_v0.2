"use client";

import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";

const CODE_LINES = [
  { text: 'def learn(concept):', color: 'var(--accent)' },
  { text: '    understanding = watch(concept)', color: 'var(--text-muted)' },
  { text: '    skills = code(understanding)', color: 'var(--text-muted)' },
  { text: '    return skills.level_up()', color: 'var(--accent)' },
];

function TypingCode(): ReactElement {
  const [visibleLines, setVisibleLines] = useState(0);
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    if (visibleLines >= CODE_LINES.length) return;
    const currentLine = CODE_LINES[visibleLines].text;
    if (visibleChars < currentLine.length) {
      const t = setTimeout(() => setVisibleChars((c) => c + 1), 35);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setVisibleLines((l) => l + 1);
      setVisibleChars(0);
    }, 300);
    return () => clearTimeout(t);
  }, [visibleLines, visibleChars]);

  return (
    <div className="font-mono text-xs sm:text-sm leading-6 sm:leading-7">
      {CODE_LINES.map((line, i) => (
        <div key={i} className="flex">
          <span className="w-6 sm:w-8 text-right mr-3 sm:mr-4 select-none" style={{ color: 'var(--text-subtle)' }}>
            {i + 1}
          </span>
          <span style={{ color: line.color }}>
            {i < visibleLines
              ? line.text
              : i === visibleLines
                ? line.text.slice(0, visibleChars)
                : ''}
            {(i === visibleLines || (visibleLines >= CODE_LINES.length && i === CODE_LINES.length - 1)) && (
              <span className="inline-block w-[2px] h-[1em] ml-px align-middle animate-[blink_1s_step-end_infinite]" style={{ background: 'var(--accent)' }} />
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

export function HeroSection(): ReactElement {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden px-4 sm:px-6">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] rounded-full opacity-[0.07] blur-[100px] animate-[drift_20s_ease-in-out_infinite]"
          style={{ background: 'var(--accent)' }}
        />
        <div
          className="absolute -bottom-1/4 -right-1/4 w-[50vw] h-[50vw] rounded-full opacity-[0.05] blur-[120px] animate-[drift_25s_ease-in-out_infinite_reverse]"
          style={{ background: 'var(--accent)' }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className={`relative z-10 max-w-5xl mx-auto text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8 sm:mb-10"
          style={{ background: 'var(--surface-muted)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
          Now in beta
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.9] mb-6 sm:mb-8">
          <span className="inline-block animate-[fadeSlideUp_0.6s_ease-out_0.1s_both]">watch.</span>{' '}
          <span className="inline-block animate-[fadeSlideUp_0.6s_ease-out_0.3s_both]">code.</span>{' '}
          <span className="inline-block animate-[fadeSlideUp_0.6s_ease-out_0.5s_both]">learn.</span>
        </h1>

        {/* Tagline */}
        <p
          className="text-base sm:text-lg md:text-xl max-w-xl mx-auto mb-10 sm:mb-12 leading-relaxed animate-[fadeSlideUp_0.6s_ease-out_0.7s_both]"
          style={{ color: 'var(--text-muted)' }}
        >
          Your CS lecture just became an IDE.
          <br />
          <span className="font-mono text-sm" style={{ color: 'var(--text-subtle)' }}>
            Video + editor + AI — one canvas, zero tab-switching.
          </span>
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 sm:mb-20 animate-[fadeSlideUp_0.6s_ease-out_0.9s_both]">
          <Link
            href="/workspace"
            className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            style={{ background: 'var(--accent)', color: 'var(--accent-foreground)', '--tw-ring-color': 'var(--text-muted)', '--tw-ring-offset-color': 'var(--background)' } as React.CSSProperties}
          >
            Start Learning
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>Free during beta · No credit card</span>
        </div>

        {/* Code editor mockup */}
        <div
          className="relative max-w-lg mx-auto rounded-xl overflow-hidden shadow-2xl animate-[fadeSlideUp_0.8s_ease-out_1.1s_both]"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full opacity-80" style={{ background: 'var(--text-subtle)' }} />
              <span className="w-2.5 h-2.5 rounded-full opacity-60" style={{ background: 'var(--text-subtle)' }} />
              <span className="w-2.5 h-2.5 rounded-full opacity-40" style={{ background: 'var(--text-subtle)' }} />
            </div>
            <span className="ml-2 text-xs font-mono" style={{ color: 'var(--text-subtle)' }}>main.py</span>
          </div>
          {/* Code */}
          <div className="p-4 sm:p-6 text-left">
            <TypingCode />
          </div>
        </div>
      </div>
    </section>
  );
}
