"use client";

import Link from "next/link";
import { useRef, useState, type ReactElement } from "react";
import { motion } from "framer-motion";

export function HeroSection(): ReactElement {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function handlePlay() {
    videoRef.current?.play();
  }

  return (
    <section className="relative z-[2] flex flex-col items-center justify-center overflow-hidden px-6 sm:px-8 pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8 sm:mb-10 border border-border bg-surface text-text-muted"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-accent" />
          Now in beta
        </motion.div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.9] mb-8 sm:mb-10 text-foreground">
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            watch.
          </motion.span>{" "}
          <motion.span
            className="inline-block text-accent"
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
          className="text-base sm:text-lg md:text-xl max-w-lg mx-auto mb-10 sm:mb-12 leading-relaxed text-text-muted"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          Your CS lecture just became an IDE.
          <br />
          <span className="font-mono text-sm text-text-subtle">
            Video + editor + AI — one canvas, zero tab-switching.
          </span>
        </motion.p>

        {/* CTA */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <Link
            href="/sign-in"
            className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-accent text-accent-foreground hover:shadow-[0_0_30px_var(--accent-muted)]"
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
          <span className="text-xs text-text-subtle">
            Free during beta · No credit card
          </span>
        </motion.div>
      </div>

      {/* Demo video */}
      <motion.div
        className="relative z-10 w-full max-w-5xl mt-12 sm:mt-16 lg:mt-20 rounded-2xl overflow-hidden shadow-2xl shadow-accent/5 border border-border bg-surface-strong"
        style={{ aspectRatio: "16 / 9" }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.1 }}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src="https://bmsvebvrbefdj0lp.public.blob.vercel-storage.com/videos/niotebook-demo-v2-final-pCWph04qFrJSOUDTBpsSU5EThVfTXG.mp4"
          preload="none"
          loop
          muted
          playsInline
          aria-label="Niotebook demo video showing the integrated learning environment"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        {!isPlaying && (
          <button
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
            aria-label="Play demo video"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
              <svg
                className="h-6 w-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        )}
      </motion.div>
    </section>
  );
}
