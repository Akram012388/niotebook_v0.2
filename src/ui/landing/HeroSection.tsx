"use client";

import Link from "next/link";
import { useRef, type ReactElement } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function HeroSection(): ReactElement {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const orbY1 = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const orbY2 = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100vh] flex items-center justify-center overflow-hidden px-4 sm:px-6 pt-20 bg-[#0A0A0A]"
    >
      {/* Acid green gradient orbs — parallax */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] rounded-full opacity-[0.12] blur-[120px] animate-[drift_20s_ease-in-out_infinite]"
          style={{ background: "#00FF66", y: orbY1 }}
        />
        <motion.div
          className="absolute -bottom-1/4 -right-1/4 w-[50vw] h-[50vw] rounded-full opacity-[0.08] blur-[140px] animate-[drift_25s_ease-in-out_infinite_reverse]"
          style={{ background: "#00FF66", y: orbY2 }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#FAFAFA 1px, transparent 1px), linear-gradient(90deg, #FAFAFA 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        className="relative z-10 max-w-5xl mx-auto text-center"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8 sm:mb-10 border border-[#404040] bg-[#171717] text-[#A3A3A3]"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-workspace-accent" />
          Now in beta
        </motion.div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.9] mb-6 sm:mb-8 text-[#FAFAFA]">
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            watch.
          </motion.span>{" "}
          <motion.span
            className="inline-block text-workspace-accent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            code.
          </motion.span>{" "}
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            learn.
          </motion.span>
        </h1>

        {/* Tagline */}
        <motion.p
          className="text-base sm:text-lg md:text-xl max-w-xl mx-auto mb-10 sm:mb-12 leading-relaxed text-[#A3A3A3]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          Your CS lecture just became an IDE.
          <br />
          <span className="font-mono text-sm text-[#737373]">
            Video + editor + AI — one canvas, zero tab-switching.
          </span>
        </motion.p>

        {/* CTA */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 sm:mb-20"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <Link
            href="/workspace"
            className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-workspace-accent text-[#0A0A0A] hover:shadow-[0_0_30px_rgba(0,255,102,0.3)]"
          >
            Start Learning
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
          <span className="text-xs text-[#737373]">
            Free during beta · No credit card
          </span>
        </motion.div>

        {/* Demo video — native aspect ratio 3320:2160 ≈ 1.537:1 */}
        <motion.div
          className="relative mx-auto mb-16 w-[90vw] max-w-6xl rounded-2xl overflow-hidden shadow-2xl shadow-workspace-accent/10 border border-[#404040]"
          style={{ aspectRatio: "3320 / 2160" }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
        >
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="/videos/niotebook-demo-final.mp4"
            autoPlay
            loop
            muted
            playsInline
            aria-label="Niotebook demo video showing the integrated learning environment"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
